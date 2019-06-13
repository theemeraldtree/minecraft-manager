import path from 'path';
import Global from '../util/global';
import fs from 'fs';
import os from 'os';
import exec from 'child_process';
const LauncherManager = {
    LAUNCHER_PROFILES: path.join(Global.MC_PATH, 'launcher_profiles.json'),
    createProfile: function (profile) {
        let obj = JSON.parse(fs.readFileSync(this.LAUNCHER_PROFILES));
        obj.profiles[`mcm-${profile.id}`] = {
            name: profile.name,
            type: "custom",
            gameDir: path.join(profile.gameDir),
            lastVersionId: profile.minecraftversion,
            lastUsed: new Date().toISOString()
        }
        fs.writeFileSync(this.LAUNCHER_PROFILES, JSON.stringify(obj));
    },
    deleteProfile: function (profile) {
        let obj = JSON.parse(fs.readFileSync(this.LAUNCHER_PROFILES));
        delete obj.profiles[`mcm-${profile.id}`];
        fs.writeFileSync(this.LAUNCHER_PROFILES, JSON.stringify(obj));
    },
    renameProfile: function(profile, newID) {
        let obj = JSON.parse(fs.readFileSync(this.LAUNCHER_PROFILES));
        let oldID = `mcm-${profile.id}`;
        let oldData = obj.profiles[oldID];
        obj.profiles[`mcm-${newID}`] = oldData;
        delete obj.profiles[oldID];
        fs.writeFileSync(this.LAUNCHER_PROFILES, JSON.stringify(obj));
    },
    setProfileData: function(profile, tag, val) {
        let id = `mcm-${profile.id}`;
        let obj = JSON.parse(fs.readFileSync(this.LAUNCHER_PROFILES));
        obj.profiles[id][tag] = val;
        fs.writeFileSync(this.LAUNCHER_PROFILES, JSON.stringify(obj));
    },
    setMostRecentProfile: function (profile) {
        let date = new Date();
        let iso = date.toISOString();
        this.setProfileData(profile, 'lastUsed', iso);
    },
    openLauncher: () => {
        let launcherPath = Global.getLauncherPath();
        if(os.platform() === 'win32') {
            exec.exec(`"${launcherPath}"`);
        }else if(os.platform() === 'darwin') {
            exec.exec(`open -a ${launcherPath}`);
        }
    }
}

export default LauncherManager;