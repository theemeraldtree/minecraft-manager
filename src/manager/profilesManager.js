import Global from "../util/global";
import LogManager from "./logManager";
import Profile from "../type/profile";
import LauncherManager from "./launcherManager";
import LibrariesManager from "./librariesManager";
import VersionsManager from "./versionsManager";
import DownloadsManager from "./downloadsManager";
import Curse from "../host/curse/curse";
import ForgeManager from "./forgeManager";
import ToastManager from "./toastManager";
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const admzip = require('adm-zip');
const ProfilesManager = {
    loadedProfiles: [],
    reloadListeners: [],
    previouslyRemovedProfiles: [],
    profilesBeingInstalled: [],
    progressState: {},
    getProfiles: function() {
        this.loadedProfiles = [];
        LogManager.log('info', '[ProfilesManager] Getting profiles...');
        return new Promise(resolve => {
            if(fs.existsSync(Global.PROFILES_PATH)) {
                fs.readdir(Global.PROFILES_PATH, (err, files) => {
                    if(files.length >= 1) {
                        files.forEach(async (file) => {
                            await this.processProfileFolder(path.join(Global.PROFILES_PATH + file));
                            this.updateReloadListeners();
                            resolve();
                        })
                    }else{
                        LogManager.log('info', '[ProfilesManager] done getting profiles');
                        this.updateReloadListeners();
                        resolve();
                    }
                })
            }else{
                this.loadedProfiles = [];
                resolve();
            }

        })
    },
    updateReloadListeners: function() {
        Global.updateCache();
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
        LogManager.log('info', `[ProfilesManager] Updating profile ${newProfile.id}`);
        const oldProfile = this.loadedProfiles.findIndex(item => (item.id === newProfile.id));
        this.loadedProfiles[oldProfile] = newProfile;
        this.updateReloadListeners();
    },
    createBackup: function(profile) {
        if(!fs.existsSync(Global.BACKUPS_DIR)) {
            fs.mkdirSync(Global.BACKUPS_DIR);
        }
        Global.copyDirSync(profile.gameDir, path.join(Global.BACKUPS_DIR, `${profile.id}-${new Date().getTime()}`));
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
    
                const importComplete = () => {
                    profile.setCurrentState('');

                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Updating profile for ${profile.id}`);
                    ProfilesManager.updateProfile(profile);

                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Removing extract path from ${profile.id}`);
                    rimraf.sync(extractPath);

                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Completed import for ${profile.id}`);
                    stateChange('Done');

                    profile.addIconToLauncher();
                    resolve();
                }

                if(profile.mods) {
                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Starting mod download for ${profile.id}`)
                    stateChange('Downloading mods...');
                    let curseModsToDownload = [];
                    for(let mod of profile.mods) {
                        if(mod.hosts) {
                            if(mod.hosts.curse) {
                                LogManager.log('info', `[ProfilesManager] (ProfileImport) Adding mod to download queue ${mod.id}`);
                                mod.cachedID = `profile-import-${mod.id}`;
                                mod.detailedInfo = false;
                                Curse.cached.assets[mod.cachedID] = mod;
                                curseModsToDownload.push(mod);
                            }
                        }
                    }
        
        

                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Creating progressive download for ${profile.id}`);
                    DownloadsManager.createProgressiveDownload(`Mods from ${profile.name}`).then((download) => {
                        let numberDownloaded = 0;

                        const concurrent = curseModsToDownload.length >=5 ? 5 : 0;
                        Curse.downloadModList(profile, curseModsToDownload.slice(), () => {
                            if(numberDownloaded === curseModsToDownload.length) {
                                DownloadsManager.removeDownload(download.name);
                                stateChange('Creating launcher profile...');
                                LogManager.log('info', `[ProfilesManager] (ProfileImport) Creating launcher profile for ${profile.id}`);
                                LauncherManager.createProfile(profile);
                                if(profile.customVersions.forge) {
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
                }else{
                    stateChange('Creating launcher profile...');
                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Creating launcher profile for ${profile.id}`);
                    LauncherManager.createProfile(profile);
                    importComplete();
                }
            });
        })
    },
    processProfileFolder: async function(location) {
        LogManager.log('info', `[ProfilesManager] Processing profile folder at ${location}`);
        let profilePath = path.join(location, '/profile.json')
        if(fs.existsSync(profilePath)) {
            let rawOMAF;
            try {
                rawOMAF = JSON.parse(fs.readFileSync(profilePath));
            }catch(e) {
                ToastManager.createToast('Warning', `The '${path.basename(location)}' profile has a corrupted/malformed JSON info file! That's no good!`, 'OMAF-PROFILE-MALFORMED-JSON');
            }
            if(rawOMAF) {
                rawOMAF.fpath = location;
                rawOMAF.installed = true;
                LogManager.log('info', `[ProfilesManager] Loading profile at ${location}`);
                let profile = new Profile(rawOMAF);
                this.loadedProfiles.push(profile);    
                

                let progvar = 'installed';
                let version = profile.version.displayName;
                if(this.progressState) {
                    if(this.progressState[profile.id]) {
                        if(this.progressState[profile.id] !== 'installed') {
                            progvar = this.progressState[profile.id].progress;
                            version = this.progressState[profile.id].version;
                        }
                    }
                }
                this.progressState[profile.id] = {
                    progress: progvar,
                    version: version
                } 
            }
        }else{
            ToastManager.createToast(`Warning`, `In your profiles folder, the '${path.basename(location)}' folder is missing the essential profile.json file!`, 'OMAF-PROFILE-MISSING-JSON');
        }
    },


    getProfileFromID: function(id) {
        return this.loadedProfiles.find(prof => prof.id === id);
    },

    containsProfileWithName: function(name) {
        for(let profile of this.loadedProfiles) {
            if(profile.name.toLowerCase() === name.toLowerCase()) {
                return true;
            }
        }
        return false;
    },

    createProfile: function(name, mcversion) {
        LogManager.log('info', `[ProfilesManager] (CreateProfile) Starting profile creation...`);
        let id = Global.createID(name);
        return new Promise(resolve => {
            LogManager.log('info', `[ProfilesManager] (CreateProfile) Creating profile directories`);
            fs.mkdirSync(path.join(Global.PROFILES_PATH, id));
            fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/files'));

            LogManager.log('info', `[ProfilesManager] Copying default logo to profile`);
            let profile = new Profile({
                id: id,
                name: name,
                minecraftversion: mcversion,
                icon: 'icon.png',
                omafVersion: '0.1.3',
                fpath: path.join(Global.PROFILES_PATH, id),
                installed: true,
                version: {
                    timestamp: new Date().getTime()
                }
            });

            profile.resetIcon();
            
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
        this.previouslyRemovedProfiles.push(profile);
        if(this.progressState[profile.id]) {
            delete this.progressState[profile.id];
        }
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
                            this.loadedProfiles.forEach(prof => {
                                // removes weird backups that can happen when the app crashes/is closed during a profile update
                                if(prof.id === profile.id && !this.previouslyRemovedProfiles.includes(prof)) {
                                    this.deleteProfile(prof);
                                }
                            })
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