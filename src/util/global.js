import SettingsManager from '../manager/settingsManager';
import ProfilesManager from '../manager/profilesManager';
import Mod from '../type/mod';
import Profile from '../type/profile';
import ToastManager from '../manager/toastManager';
import HTTPRequest from '../host/httprequest';

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
    MC_VERSIONS: [],
    ALL_VERSIONS: [],
    cacheUpdateTime: new Date().getTime(),
    cached: {
        versions: {}
    },
    async updateMCVersions(firstTime) {
        let versionsJSON;
        let req;
        if(fs.existsSync(path.join(this.MCM_PATH, '/mcvercache.json'))) {
            this.parseVersionsJSON(JSON.parse(fs.readFileSync(path.join(this.MCM_PATH, '/mcvercache.json'))));
        }

        try {
            req = await HTTPRequest.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');
        }catch(e) {
            req = undefined;
        }

        if(req !== undefined) {
            versionsJSON = JSON.parse(req);
        }else if(req == undefined && firstTime) {
            ToastManager.createToast('Uh oh!', "We're having trouble downloading the latest Minecraft versions. This is necessary for Minecraft Manager to function. Check your internet connection and try again");
            return 'no-connection';
        }
        if(versionsJSON) {
             this.parseVersionsJSON(versionsJSON);
        }
    },
    parseVersionsJSON(versionsJSON) {
        this.ALL_VERSIONS = [];
        this.MC_VERSIONS = [];
        for(let ver of versionsJSON.versions) {
            this.ALL_VERSIONS.push(ver.id);
            if(ver.type === 'release') {
                this.MC_VERSIONS.push(ver.id);
            }
        }
        fs.writeFileSync(path.join(this.MCM_PATH, '/mcvercache.json'), JSON.stringify(versionsJSON));
  
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
        let showMigrationmessage = false;
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
                }else if(profile.omafVersion === '0.1.2') {
                    profile.omafVersion = '0.1.3';
                    if(!(profile.version instanceof Object)) {
                        profile.version = {
                            displayname: profile.version,
                            timestamp: profile.versionTimestamp
                        }

                        profile.versionTimestamp = undefined;
                    }

                    profile.save();

                    showMigrationmessage = true;
                }
            }
        }

        if(showMigrationmessage) {
            console.log('Migration message');
            ToastManager.createToast('Hey There!', 'Hello there beta tester! Just a quick message about this new version: your old profiles will not work 100%. Some features may work, some may not. This is due to internal restructuring as to how many things are stored. We hope you understand!');
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