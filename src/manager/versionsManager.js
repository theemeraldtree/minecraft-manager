import path from 'path';
import Global from '../util/global';
import fs from 'fs';
import LauncherManager from './launcherManager';
import rimraf from 'rimraf';
const defaultVersion = require('../assets/defaultVersion.json');
const VersionsManager = {
    VERSIONS_PATH: path.join(Global.MC_PATH, '/versions'),
    createVersion: function(profile) {
        let versionname = `${profile.name} [Minecraft Manager]`;
        fs.mkdirSync(path.join(this.VERSIONS_PATH, versionname));
        let obj = defaultVersion;
        obj.id = versionname;
        obj.inheritsFrom = profile.minecraftversion;
        obj.jar = profile.minecraftversion;
        obj.libraries[0].name = `minecraftmanager:profiles:mcm-${profile.id}`;

        fs.writeFile(path.join(this.VERSIONS_PATH, versionname, `${versionname}.json`), JSON.stringify(obj), () => {
            profile.setVersion(versionname);
            LauncherManager.setProfileData(profile, 'lastVersionId', versionname);
        });
    },
    deleteVersion: function(profile) {
        return new Promise((resolve) => {
            if(fs.existsSync(path.join(this.VERSIONS_PATH, profile.launcherVersion))) {
                rimraf(path.join(this.VERSIONS_PATH, profile.launcherVersion), () => {
                    if(fs.existsSync(path.join(this.VERSIONS_PATH, `${profile.name} [Minecraft Manager]`))) {
                        rimraf(path.join(this.VERSIONS_PATH, `${profile.name} [Minecraft Manager]`), () => {
                            resolve();
                        })
                    }else{
                        resolve();
                    }
                })
            }else{
                if(fs.existsSync(path.join(this.VERSIONS_PATH, `${profile.name} [Minecraft Manager]`))) {
                    rimraf(path.join(this.VERSIONS_PATH, `${profile.name} [Minecraft Manager]`), () => {
                        resolve();
                    })
                }else{
                    resolve();
                }
            }
        })
    }
}

export default VersionsManager;