import Global from "../util/global";
import LogManager from "./logManager";
import Profile from "../type/profile";
import LauncherManager from "./launcherManager";
import LibrariesManager from "./librariesManager";
import VersionsManager from "./versionsManager";
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

const ProfilesManager = {
    loadedProfiles: [],
    getProfiles: function() {
        this.loadedProfiles = [];
        LogManager.log('info', '[ProfilesManager] Getting profiles...');
        return new Promise(resolve => {
            fs.readdir(Global.PROFILES_PATH, (err, files) => {
                if(files.length >= 1) {
                    files.forEach(async (file) => {
                        await this.processProfileFolder(path.join(Global.PROFILES_PATH + file));
                        resolve();
                    })
                }else{
                    resolve();
                }
            })
        })
    },
    updateProfile: function(newProfile) {
        const oldProfile = this.loadedProfiles.findIndex(item => (item.id === newProfile.id));
        this.loadedProfiles[oldProfile] = newProfile;
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