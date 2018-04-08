import Profile from '../util/profile';
import FileUtils from '../util/fileUtils';
import ProfileManager from './profileManager';
import UserSettings from '../util/userSettings';
const os = require('os');
const fs = require('fs');
const path = require('path');
const exec = require('child_process');
class MinecraftLauncherManager {
    constructor() {
        this.profiles = [];
    }

    getLauncher = () => {
        if(os.platform() === "win32") {
            return path.join("C:\\Program Files (x86)\\Minecraft\\MinecraftLauncher.exe");
        }else if(os.platform() === "darwin") {
            return path.join("/Applications/Minecraft.app");
        }
    }

    openLauncher = () => {
        if(os.platform() === "win32") {
            exec.exec(`"${this.getLauncher()}"`, () => {
                console.log('a?');
            });            
        }else if(os.platform() === "darwin") {
            exec.exec(`open -a "${this.getLauncher()}"`);            
        }
    }

    setMostRecentProfile = (profile) => {
        var d = new Date();
        var n = d.toISOString();
        if(profile instanceof Profile) {
            this.setProfileData(`mcm-${profile.id}`, "lastUsed", n);
            this.setProfileData(`mcm-${profile.id}`, "javaArgs", `-Xmx${Math.trunc(UserSettings.readOption("ram"))}G -XX:+UseConcMarkSweepGC -XX:+CMSIncrementalMode -XX:-UseAdaptiveSizePolicy -Xmn128M`)
        }
    }

    updateRam = () => {
        ProfileManager.loadProfiles().then((profiles) => {
            for(let profile of profiles) {
                if(this.hasProfile(`mcm-${profile.id}`)) {
                    this.setProfileData(`mcm-${profile.id}`, 'javaArgs', `-Xmx${Math.trunc(UserSettings.readOption("ram"))}G -XX:+UseConcMarkSweepGC -XX:+CMSIncrementalMode -XX:-UseAdaptiveSizePolicy -Xmn128M`);
                }
            }
        })
    }

    setProfileID = (oldId, newId) => {
        return new Promise((resolve) => {
            var json = JSON.parse(fs.readFileSync(path.join(FileUtils.getMCFolder(), '/launcher_profiles.json')));
            json.profiles[newId] = json.profiles[oldId];
            delete json.profiles[oldId];
            fs.writeFile(path.join(FileUtils.getMCFolder(), '/launcher_profiles.json'), JSON.stringify(json), () => {
                resolve(true);
            });
        }) 
             
    }

    setProfileData(id, tag, val) {
        return new Promise((resolve) => {
            var json = JSON.parse(fs.readFileSync(path.join(FileUtils.getMCFolder(), '/launcher_profiles.json')));
            var prof = json.profiles[id];
            prof[tag] = val;
            fs.writeFile(path.join(FileUtils.getMCFolder(), '/launcher_profiles.json'), JSON.stringify(json), () => {
                resolve(true);
            });                
        });
    }

    addProfile(id, name, dir) {
        var json = JSON.parse(fs.readFileSync(path.join(FileUtils.getMCFolder(), '/launcher_profiles.json')));
        json.profiles[id] = {};
        json.profiles[id].name = name;
        json.profiles[id].gameDir = dir;
        json.profiles[id].type = "custom";
        json.profiles[id].javaArgs =`-Xmx${UserSettings.readOption("ram")}G -XX:+UseConcMarkSweepGC -XX:+CMSIncrementalMode -XX:-UseAdaptiveSizePolicy -Xmn128M`;

        // Set the date as the current time
        var d = new Date();
        var n = d.toISOString();
        json.profiles[id].lastUsed = n;
        fs.writeFileSync(path.join(FileUtils.getMCFolder(), '/launcher_profiles.json'), JSON.stringify(json));
    }
    hasProfile(id) {
        var json = JSON.parse(fs.readFileSync(path.join(FileUtils.getMCFolder(), '/launcher_profiles.json')));
        if(json.profiles[id] != undefined) {
            return true;
        }else{
            return false;
        }
    }
    deleteProfile(id) {
        return new Promise((resolve) => {
            fs.readFile(path.join(FileUtils.getMCFolder(), `/launcher_profiles.json`), (err, data) => {
                console.log(data);
                var json = JSON.parse(data);
                console.log(json);
                delete json.profiles[id];
                fs.writeFile(path.join(FileUtils.getMCFolder(), '/launcher_profiles.json'), JSON.stringify(json), () => {
                    resolve();
                })
            })

        })

    }
    getProfiles() {
        var json = JSON.parse(fs.readFileSync(path.join(FileUtils.getMCFolder(), '/launcher_profiles.json')));
        return json.profiles;
    }
}

export default new MinecraftLauncherManager();