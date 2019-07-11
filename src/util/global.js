import SettingsManager from '../manager/settingsManager';
import ProfilesManager from '../manager/profilesManager';
import Mod from '../type/mod';
import Profile from '../type/profile';

const remote = require('electron').remote;
const app = remote.app;
const path = require('path');
const os = require('os');
const fs = require('fs');
const Global = {
    MCM_PATH: app.getPath('userData'),
    BACKUPS_DIR: path.join(app.getPath('userData'), `/backups`),
    MCM_TEMP: path.join(app.getPath('userData'), `/temp/`),
    PROFILES_PATH: path.join(app.getPath('userData') + '/profiles/'),
    MC_VERSIONS: ['1.14.2', '1.14.1', '1.14', '1.13.2', '1.13.1', '1.13', '1.12.2', '1.12.1', '1.12', '1.11.2', '1.11.1', '1.11', '1.10.2', '1.10.1', '1.10', '1.9.4', '1.9.3', '1.9.2', '1.9.1', '1.9.0', '1.8.9', '1.8.8', '1.8.7', '1.8.6', '1.8.5', '1.8.4', '1.8.3', '1.8.2', '1.8.1', '1.8', '1.7.10', '1.7.9', '1.7.8', '1.7.7', '1.7.6', '1.7.5', '1.7.4', '1.7.3', '1.7.2', '1.6.4', '1.6.2', '1.6.1', '1.5.2', '1.5.1', '1.4.7', '1.4.6', '1.4.5', '1.4.4', '1.4.2', '1.3.2', '1.3.1', '1.2.5', '1.2.4', '1.2.3', '1.2.2', '1.2.1', '1.1', '1.0'],
    cacheUpdateTime: new Date().getTime(),
    cached: {
        versions: {}
    },
    getMCFilterOptions() {
        let copy = this.MC_VERSIONS.slice(0);
        copy.unshift('All');
        return copy;
    },
    getLauncherPath: () => {
        return SettingsManager.currentSettings.mcExe;
    },
    createID: (name) => {
        let newname = name;
        newname = name.replace(/[^\w]/gi, '-').toLowerCase();
        newname = newname.replace('/', '');
        return newname;
    },
    createSafeName: (name) => {
        return name.replace(/[\W_]+/g, ' ');
    },
    getResourcesPath: () => {
        let dev = false;
        if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
            dev = true;
        }
        if(dev) {
            return path.join('resources');
        }else{
            if(os.platform() === 'win32' || os.platform() === 'darwin') {
                return path.join(remote.app.getAppPath(), `../resources`);
            }else{
                return null;
            }
        }
    },
    getTypeString: (obj) => {
        if(obj instanceof Mod) {
            return 'mod';
        }else if(obj instanceof Profile) {
            return 'profile';
        }
    },
    getDefaultMinecraftPath: () => {
        if(os.platform() === 'win32') {
            let dotMinecraft = path.join(app.getPath('appData'), '.minecraft');
            if(fs.existsSync(dotMinecraft)) {
                return dotMinecraft;
            }else{
                return app.getPath('appData');
            }
        }else if(os.platform() === 'darwin') {
            let mc = path.join(app.getPath('appData'), 'minecraft');
            if(fs.existsSync(mc)) {
                return mc;
            }else{
                return app.getPath('appData');
            }
        }
        return '/';
    },
    getDefaultMCExePath: () => {
        if(os.platform() === 'win32') {
            let def = path.join('C:\\Program Files (x86)\\Minecraft\\MinecraftLauncher.exe');
            if(fs.existsSync(def)) {
                return def;
            }else{
                return path.join('C:\\Program Files (x86)');
            }
        }else if(os.platform() === 'darwin') {
            return path.join('/Applications/');
        }
    },
    getMCPath: () => {
        return SettingsManager.MC_HOME;
    },
    copyDirSync: function(src, dest) {
        const exists = fs.existsSync(src);
        const stats = exists && fs.statSync(src);
        const isDirectory = exists && stats.isDirectory();
        if(exists && isDirectory) {
            fs.mkdirSync(dest);
            fs.readdirSync(src).forEach((childItem) => {
                this.copyDirSync(path.join(src, childItem), path.join(dest, childItem));
            })
        }else{
            fs.linkSync(src, dest);
        }
    },
    checkMigration: function() {
        for(let profile of ProfilesManager.loadedProfiles) {
            
            // From beta 4.1 and earlier there was no info about the OMAF format version
            if(!profile.omafVersion) {
                profile.omafVersion = '0.1';
                
                if(profile.hosts.curse) {
                    profile.hosts.curse.fullyInstalled = true;
                }

                profile.save();
            }else{
                if(profile.omafVersion === '0.1') {
                    profile.omafVersion = '0.1.1';

                    profile.version = 'unknown';
                    profile.save();
                }else if(profile.omafVersion === '0.1.1') {
                    profile.omafVersion = '0.1.2';
                    if(profile.hosts.curse) {
                        profile.hosts.curse.slug = profile.hosts.curse.id;
                        profile.hosts.curse.id = 'unknown';
                    }

                    if(profile.mods) {
                        for(let mod of profile.mods) {
                            if(mod.hosts) {
                                if(mod.hosts.curse) {
                                    mod.hosts.curse.slug = mod.hosts.curse.id;
                                    mod.hosts.curse.id = 'unknown';
                                }
                            }
                        }
                    }

                    profile.addIconToLauncher();

                    profile.save();
                }
            }
        }

        ProfilesManager.updateReloadListeners();
    },
    updateCache: function() {
        Global.cacheUpdateTime = new Date().getTime();
    },
    cacheImage: function(image) {
        const img = new Image();
        img.src = image;
    }
}

export default Global;