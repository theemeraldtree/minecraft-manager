import path from 'path';
import Global from '../util/global';
import fs from 'fs';
import LauncherManager from './launcherManager';
import rimraf from 'rimraf';
const defaultVersion = require('../assets/defaultVersion.json');
const version1710 = require('../assets/1710version.json');
const VersionsManager = {
    getVersionsPath: function() {
        return path.join(Global.getMCPath(), '/versions')
    },
    createVersion: function(profile) {
        let versionname = `${profile.safename} [Minecraft Manager]`;
        if(!fs.existsSync(path.join(this.getVersionsPath(), versionname))) {
            fs.mkdirSync(path.join(this.getVersionsPath(), versionname));
        }
        let obj = defaultVersion;
        if(this.checkIs1710OrLower(profile)) {
            obj = version1710;
        }
        obj.id = versionname;
        obj.inheritsFrom = profile.minecraftversion;
        obj.jar = profile.minecraftversion;
        obj.assets = profile.minecraftversion;
        obj.libraries[0].name = `minecraftmanager:profiles:mcm-${profile.id}`;

        fs.writeFile(path.join(this.getVersionsPath(), versionname, `${versionname}.json`), JSON.stringify(obj), () => {
            profile.setVersion(versionname);
            LauncherManager.setProfileData(profile, 'lastVersionId', versionname);
        });
    },
    checkIs1710OrLower: function(profile) {
        const ver = profile.minecraftversion;
        switch(ver) {
            case '1.7.10':
                return true;
            case '1.7.2':
                return true;
            case '1.6.4':
                return true;
            case '1.6.3':
                return true;
            case '1.6.2':
                return true;
            case '1.6.1':
                return true;
            default:
                return false;
        }
    },
    deleteVersion: function(profile) {
        return new Promise((resolve) => {
            if(profile.launcherVersion) {
                if(fs.existsSync(path.join(this.getVersionsPath(), profile.launcherVersion))) {
                    rimraf(path.join(this.getVersionsPath(), profile.launcherVersion), () => {
                        if(fs.existsSync(path.join(this.getVersionsPath(), `${profile.safename} [Minecraft Manager]`))) {
                            rimraf(path.join(this.getVersionsPath(), `${profile.safename} [Minecraft Manager]`), () => {
                                resolve();
                            })
                        }else{
                            resolve();
                        }
                    })
                }else{
                    if(fs.existsSync(path.join(this.getVersionsPath(), `${profile.safename} [Minecraft Manager]`))) {
                        rimraf(path.join(this.getVersionsPath(), `${profile.safename} [Minecraft Manager]`), () => {
                            resolve();
                        })
                    }else{
                        resolve();
                    }
                }
            }else{
                resolve();
            }
        })
    }
}

export default VersionsManager;