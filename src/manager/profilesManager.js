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
        this.reloadListeners.push(listener);
    },
    unregisterReloadListener: function(listener) {
        this.reloadListeners.splice(this.reloadListeners.indexOf(listener), 1);
    },
    updateProfile: function(newProfile) {
        const oldProfile = this.loadedProfiles.findIndex(item => (item.id === newProfile.id));
        this.loadedProfiles[oldProfile] = newProfile;
    },
    importProfile: function(profilePath, stateChange) {
        return new Promise((resolve) => {
            const zip = new admzip(profilePath);
        
            stateChange('Extracting...');
            const extractPath = path.join(Global.MCM_TEMP, `profileimport-${new Date().getTime()}`);
            zip.extractAllTo(extractPath, true);
    
            stateChange('Copying...');
            const obj = JSON.parse(fs.readFileSync(path.join(extractPath, '/profile.json')));

            const profPath = path.join(Global.PROFILES_PATH, `/${obj.id}/`);
            if(fs.existsSync(profPath)) {
                throw `There is already a profile with the name: ${obj.name}`;
            }
            Global.copyDirSync(extractPath, profPath);
    
            stateChange('Reloading profiles...');
            this.getProfiles().then(() => {
                const profile = this.getProfileFromID(obj.id);
                profile.setCurrentState('importing...');
    
                stateChange('Downloading mods...');
                let curseModsToDownload = [];
                for(let mod of profile.mods) {
                    if(mod.hosts) {
                        if(mod.hosts.curse) {
                            mod.cachedID = `profile-import-${mod.id}`;
                            mod.detailedInfo = false;
                            Curse.cachedItems[mod.cachedID] = mod;
                            curseModsToDownload.push(mod);
                        }
                    }
                }
    
                const concurrent = curseModsToDownload.length >=5 ? 5 : 0;
    
                DownloadsManager.createProgressiveDownload(`Mods from ${profile.name}`).then((download) => {
                    let numberDownloaded = 0;
                    Curse.downloadModList(profile, curseModsToDownload.slice(), () => {
                        if(numberDownloaded === curseModsToDownload.length) {
                            stateChange('Creating launcher profile...');
                            DownloadsManager.removeDownload(download.name);
                            LauncherManager.createProfile(profile);
                            if(profile.forgeInstalled) {
                                stateChange('Installing forge...');
                                ForgeManager.setupForge(profile).then(() => {
                                    profile.setCurrentState('');
                                    ProfilesManager.updateProfile(profile);
                                    rimraf.sync(extractPath);
                                    stateChange('Done');
                                    resolve();
                                });
                            }else{
                                profile.setCurrentState('');
                                ProfilesManager.updateProfile(profile);
                                rimraf.sync(extractPath);
                                stateChange('Done');
                                resolve();
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

            LogManager.log('info', `[ProfilesManager] Creating profile at ${location}`);
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
        let id = Global.createID(name);
        return new Promise(resolve => {
            fs.mkdirSync(path.join(Global.PROFILES_PATH, id));
            fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/files'));
            fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/files/mods'));
            fs.copyFileSync(path.join(Global.getResourcesPath(), '/logo-sm.png'), path.join(Global.PROFILES_PATH, id, '/icon.png'));
            let profile = new Profile({
                id: id,
                name: name,
                minecraftversion: mcversion,
                icon: 'icon.png'
            });
            LauncherManager.createProfile(profile);
            profile.save().then(() => {
                this.loadedProfiles = [];
                this.getProfiles().then(() => {
                    resolve(profile);
                })
            });
        });
    },

    deleteProfile: function(profile) {
        return new Promise((resolve) => {
            LauncherManager.deleteProfile(profile);
            rimraf(profile.folderpath, () => {
                LibrariesManager.deleteLibrary(profile).then(() => {
                    VersionsManager.deleteVersion(profile).then(() => {
                        this.loadedProfiles = [];
                        this.getProfiles().then(() => {
                            resolve();
                        });
                    });
                });
            });
        })
    }
}

export default ProfilesManager;