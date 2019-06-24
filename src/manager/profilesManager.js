import Global from "../util/global";
import LogManager from "./logManager";
import Profile from "../type/profile";
import LauncherManager from "./launcherManager";
import LibrariesManager from "./librariesManager";
import VersionsManager from "./versionsManager";
import DownloadsManager from "./downloadsManager";
import Curse from "../host/curse/curse";
import ForgeManager from "./forgeManager";
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const admzip = require('adm-zip');
const ProfilesManager = {
    loadedProfiles: [],
    reloadListeners: [],
    profilesBeingInstalled: [],
    getProfiles: function() {
        this.loadedProfiles = [];
        LogManager.log('info', '[ProfilesManager] Getting profiles...');
        return new Promise(resolve => {
            fs.readdir(Global.PROFILES_PATH, (err, files) => {
                if(files.length >= 1) {
                    files.forEach(async (file) => {
                        await this.processProfileFolder(path.join(Global.PROFILES_PATH + file));
                        this.updateReloadListeners();
                        resolve();
                    })
                }else{
                    this.updateReloadListeners();
                    resolve();
                }
            })
        })
    },
    updateReloadListeners: function() {
        for(let listener of this.reloadListeners) {
            listener();
        }
    },
    registerReloadListener: function(listener) {
        LogManager.log('info', '[ProfilesManager] Registering reload listener');
        this.reloadListeners.push(listener);
    },
    unregisterReloadListener: function(listener) {
        LogManager.log('info', '[ProfilesManager] Unregistering reload listener');
        this.reloadListeners.splice(this.reloadListeners.indexOf(listener), 1);
    },
    updateProfile: function(newProfile) {
        LogManager.log('info', `[ProfilesManager] Upadting profile ${newProfile.id}`);
        const oldProfile = this.loadedProfiles.findIndex(item => (item.id === newProfile.id));
        this.loadedProfiles[oldProfile] = newProfile;
        this.updateReloadListeners();
    },
    importProfile: function(profilePath, stateChange) {
        return new Promise((resolve) => {
            const zip = new admzip(profilePath);
        
            stateChange('Extracting...');
            const extractPath = path.join(Global.MCM_TEMP, `profileimport-${new Date().getTime()}`);
            zip.extractAllTo(extractPath, true);    
            LogManager.log('info', `[ProfilesManager] (ProfileImport) Extracting profile from ${extractPath}`);

            stateChange('Copying...');
            LogManager.log('info', `[ProfilesManager] (ProfileImport) Reading profile json file from ${path.join(extractPath, '/profile.json')}`)
            const obj = JSON.parse(fs.readFileSync(path.join(extractPath, '/profile.json')));
            const profPath = path.join(Global.PROFILES_PATH, `/${obj.id}/`);
            LogManager.log('info', `[ProfilesManager] (ProfileImport) Copying profile from ${path.join(extractPath)} to ${profPath}`);
            
            if(fs.existsSync(profPath)) {
                throw `There is already a profile with the name: ${obj.name}`;
            }
            Global.copyDirSync(extractPath, profPath);
    
            stateChange('Reloading profiles...');
            LogManager.log('info', `[ProfilesManager] (ProfileImport) Reloading profiles`);
            this.getProfiles().then(() => {
                const profile = this.getProfileFromID(obj.id);
                profile.setCurrentState('importing...');
    
                LogManager.log('info', `[ProfilesManager] (ProfileImport) Starting mod download for ${profile.id}`)
                stateChange('Downloading mods...');
                let curseModsToDownload = [];
                for(let mod of profile.mods) {
                    if(mod.hosts) {
                        if(mod.hosts.curse) {
                            LogManager.log('info', `[ProfilesManager] (ProfileImport) Adding mod to download queue ${mod.id}`);
                            mod.cachedID = `profile-import-${mod.id}`;
                            mod.detailedInfo = false;
                            Curse.cachedItems[mod.cachedID] = mod;
                            curseModsToDownload.push(mod);
                        }
                    }
                }
    
                const concurrent = curseModsToDownload.length >=5 ? 5 : 0;
    
                const importComplete = () => {
                    profile.setCurrentState('');

                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Updating profile for ${profile.id}`);
                    ProfilesManager.updateProfile(profile);

                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Removing extract path from ${profile.id}`);
                    rimraf.sync(extractPath);

                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Completed import for ${profile.id}`);
                    stateChange('Done');
                    resolve();
                }
                LogManager.log('info', `[ProfilesManager] (ProfileImport) Creating progressive download for ${profile.id}`);
                DownloadsManager.createProgressiveDownload(`Mods from ${profile.name}`).then((download) => {
                    let numberDownloaded = 0;
                    Curse.downloadModList(profile, curseModsToDownload.slice(), () => {
                        if(numberDownloaded === curseModsToDownload.length) {
                            stateChange('Creating launcher profile...');
                            DownloadsManager.removeDownload(download.name);
                            LogManager.log('info', `[ProfilesManager] (ProfileImport) Creating launcher profile for ${profile.id}`);
                            LauncherManager.createProfile(profile);
                            if(profile.forgeInstalled) {
                                LogManager.log('info', `[ProfilesManager] (ProfileImport) Installing Forge for ${profile.id}`);
                                stateChange('Installing forge...');
                                ForgeManager.setupForge(profile).then(() => {
                                    importComplete();
                                });
                            }else{
                                importComplete();
                            }
                        }
                    }, () => {
                        numberDownloaded++;
                        DownloadsManager.setDownloadProgress(download.name, Math.ceil((numberDownloaded/curseModsToDownload.length) * 100));
                    }, concurrent)
                })
            });
        })
    },
    processProfileFolder: async function(location) {
        LogManager.log('info', `[ProfilesManager] Processing profile folder at ${location}`);
        let profilePath = path.join(location, '/profile.json')
        if(fs.existsSync(profilePath)) {
            let rawOMAF = JSON.parse(fs.readFileSync(profilePath));

            LogManager.log('info', `[ProfilesManager] Loading profile at ${location}`);
            let profile = new Profile(rawOMAF);
            this.loadedProfiles.push(profile);
        }else{
            LogManager.log('SEVERE', `Error: Profile at path ${location} DOES NOT CONTAIN a profile.json file! The profile is probably improperly imported or created! Fix this now, as furthur imports of this profile will not work!`)
        }
    },


    getProfileFromID: function(id) {
        for(let profile of this.loadedProfiles) {
            if(profile.id === id) {
                return profile;
            }
        }
        
        throw `Profile with ID: ${id} not found`
    },

    createProfile: function(name, mcversion) {
        LogManager.log('info', `[ProfilesManager] (CreateProfile) Starting profile creation...`);
        let id = Global.createID(name);
        return new Promise(resolve => {
            LogManager.log('info', `[ProfilesManager] (CreateProfile) Creating profile directories`);
            fs.mkdirSync(path.join(Global.PROFILES_PATH, id));
            fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/files'));
            fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/files/mods'));

            LogManager.log('info', `[ProfilesManager] Copying default logo to profile`);
            fs.copyFileSync(path.join(Global.getResourcesPath(), '/logo-sm.png'), path.join(Global.PROFILES_PATH, id, '/icon.png'));
            let profile = new Profile({
                id: id,
                name: name,
                minecraftversion: mcversion,
                icon: 'icon.png',
                omafVersion: '0.1'
            });
            LogManager.log('info', `[ProfilesManager] (CreateProfile) Creating launcher profile`);
            LauncherManager.createProfile(profile);

            LogManager.log('info', `[ProfilesManager] (CreateProfile) Saving profile`)
            profile.save().then(() => {
                this.loadedProfiles = [];

                LogManager.log('info', `[ProfilesManager] (CreateProfile) Reloading profiles`);
                this.getProfiles().then(() => {

                    LogManager.log('info', `[ProfilesManager] (CreateProfile) Completed profile creation for ${profile.id}`);
                    resolve(profile);
                })
            });
        });
    },

    deleteProfile: function(profile) {
        LogManager.log('info', `[ProfilesManager] (DeleteProfile) Starting profile deletion for ${profile.id}`);
        return new Promise((resolve) => {
            LogManager.log('info', `[ProfilesManager] (DeleteProfile) Deleting launcher profile for ${profile.id}`);
            LauncherManager.deleteProfile(profile);

            LogManager.log('info', `[ProfilesManager] (DeleteProfile) Removing profile folder from ${profile.id}`);
            rimraf(profile.folderpath, () => {

                LogManager.log('info', `[ProfilesManager] (DeleteProfile) Removing library from ${profile.id}`);
                LibrariesManager.deleteLibrary(profile).then(() => {
                    LogManager.log('info', `[ProfilesManager] (DeleteProfile) Removing version from ${profile.id}`);
                    VersionsManager.deleteVersion(profile).then(() => {
                        this.loadedProfiles = [];
                        LogManager.log('info', `[ProfilesManager] (DeleteProfile) Reloading profiles`);
                        this.getProfiles().then(() => {
                            LogManager.log('info', `[ProfilesManager] (DeleteProfile) Done`);
                            resolve();
                        });
                    });
                });
            });
        })
    }
}

export default ProfilesManager;