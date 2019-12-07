import path from 'path';
import Global from '../util/global';
import fs from 'fs';
import os from 'os';
import exec from 'child_process';
import ProfilesManager from './profilesManager';
import SettingsManager from './settingsManager';
import LogManager from './logManager';
const LauncherManager = {
    DEFAULT_JAVA_ARGS: '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M',
    getLauncherProfiles: function() {
        return path.join(Global.getMCPath(), '/launcher_profiles.json');
    },
    profileExists: function(profile) {
        let id = `mcm-${profile.id}`;
        let obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
        if(obj.profiles[id]) {
            return true;
        }else{
            return false;
        }
    },
    updateVersion: function(profile) {
        let verId;
        if(profile.customVersions.forge) {
            verId = `${profile.safename} [Minecraft Manager]`
        }else{
            verId = profile.minecraftversion;
        }
        this.setProfileData(profile, 'lastVersionId', verId);
    },
    createProfile: function (profile) {
        let obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
        obj.profiles[`mcm-${profile.id}`] = {
            name: profile.name,
            type: "custom",
            gameDir: path.join(profile.gameDir),
            lastVersionId: profile.minecraftversion,
            lastUsed: new Date().toISOString(),
            javaArgs: `-Xmx${SettingsManager.currentSettings.dedicatedRam}G ${this.DEFAULT_JAVA_ARGS}`
        }
        fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
    },
    deleteProfile: function (profile) {
        let obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
        delete obj.profiles[`mcm-${profile.id}`];
        fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
    },
    renameProfile: function(profile, newID) {
        let obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
        let oldID = `mcm-${profile.id}`;
        let oldData = obj.profiles[oldID];
        obj.profiles[`mcm-${newID}`] = oldData;
        delete obj.profiles[oldID];
        fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
    },
    setProfileData: function(profile, tag, val) {
        let id = `mcm-${profile.id}`;
        let obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
        obj.profiles[id][tag] = val;
        fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
    },
    setMostRecentProfile: function (profile) {
        let date = new Date();
        let iso = date.toISOString();
        this.setProfileData(profile, 'lastUsed', iso);
    },
    openLauncher: function() {
        let launcherPath = Global.getLauncherPath();
        if(os.platform() === 'win32') {
            exec.exec(`"${launcherPath}"`);
        }else if(os.platform() === 'darwin') {
            exec.exec(`open -a ${launcherPath}`);
        }
    },
    setLaunchArguments: function(profile, args) {
        this.setProfileData(profile, 'javaArgs', args);
    },
    setDedicatedRam: function(amount) {
        for(let profile of ProfilesManager.loadedProfiles) {
            this.setLaunchArguments(profile, `-Xmx${amount}G ${this.DEFAULT_JAVA_ARGS}`)
        }
    },
    cleanMinecraftProfiles: function() {
        LogManager.log('info', '[LauncherManager] [CleanMinecraftProfiles] Starting clean...')
        const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
        Object.keys(obj.profiles).forEach(key => {
            if(key.substring(0, 4) === 'mcm-') {
                if(!ProfilesManager.loadedProfiles.find(prof => key === `mcm-${prof.id}`)) {
                    delete obj.profiles[key];
                    LogManager.log('info', `[LauncherManager] [CleanMinecraftProfiles] Removed profile key ${key}`);
                }
            }
        });
        LogManager.log('info', '[LauncherManager] [CleanMinecraftProfiles] Writing changes...');
        fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
        LogManager.log('info', '[LauncherManager] [CleanMinecraftProfiles] Successfully written');
    }
}

export default LauncherManager;