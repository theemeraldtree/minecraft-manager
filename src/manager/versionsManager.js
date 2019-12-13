import path from 'path';
import Global from '../util/global';
import fs from 'fs';
import LauncherManager from './launcherManager';
import rimraf from 'rimraf';
import ProfilesManager from './profilesManager';
import LogManager from './logManager';
const defaultVersion = require('../assets/defaultVersion.json');
const defaultVersionFabric = require('../assets/defaultVersionFabric.json');
const version1710 = require('../assets/1710version.json');
const semver = require('semver');
const VersionsManager = {
    getVersionsPath: function() {
        return path.join(Global.getMCPath(), '/versions')
    },
    createVersion: function(profile, type) {
        let versionname = `${profile.safename} [Minecraft Manager]`;
        if(!fs.existsSync(path.join(this.getVersionsPath(), versionname))) {
            fs.mkdirSync(path.join(this.getVersionsPath(), versionname));
        }
        let obj;
        if(type === 'forge') {
            obj = defaultVersion;
            if(this.checkIs1710OrLower(profile)) {
                obj = version1710;
            }
            obj.id = versionname;
            obj.inheritsFrom = profile.minecraftversion;
            obj.jar = profile.minecraftversion;
            obj.assets = profile.minecraftversion;
            obj.libraries[0].name = `minecraftmanager.profiles:mcm-${profile.id}`;
        }
        fs.writeFile(path.join(this.getVersionsPath(), versionname, `${versionname}.json`), JSON.stringify(obj), () => {
            profile.setVersion(versionname);
            LauncherManager.setProfileData(profile, 'lastVersionId', versionname);
        });
    },
    createVersionFabric: function(profile, meta) {

        let versionname = `${profile.safename} [Minecraft Manager]`;
        if(!fs.existsSync(path.join(this.getVersionsPath(), versionname))) {
            fs.mkdirSync(path.join(this.getVersionsPath(), versionname));
        }
        let obj = defaultVersionFabric;
        obj.libraries = meta.launcherMeta.libraries.common;
        obj.id = versionname;
        obj.inheritsFrom = profile.minecraftversion;

        obj.libraries.push({
            name: `minecraftmanager.profiles:mcm-${profile.id}:fabric-intermediary`,
            url: `https://maven.fabricmc.net`
        });
        obj.libraries.push({
            name: `minecraftmanager.profiles:mcm-${profile.id}:fabric-loader`,
            url: `https://maven.fabricmc.net`
        });
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
    checkIs113OrHigher: function(profile) {
        let version = profile.minecraftversion;
        if(version.split('.').length === 2) {
            let arr = version.split('.');
            arr.push('0');
            version = arr.join('.');
        }
        return semver.gte(version, '1.13.0');
    },
    renameVersion: function(profile, newName) {
        const oldVersionName = `${profile.safename} [Minecraft Manager]`;
        const newVersionName = `${newName} [Minecraft Manager]`;

        const oldVersionPath = path.join(this.getVersionsPath(), oldVersionName);
        const newVersionPath = path.join(this.getVersionsPath(), newVersionName);
        fs.renameSync(path.join(oldVersionPath, `/${oldVersionName}.json`), path.join(oldVersionPath, `/${newVersionName}.json`));
        fs.renameSync(oldVersionPath, newVersionPath);
    },
    deleteVersion: function(profile) {
        return new Promise((resolve) => {
            if(fs.existsSync(path.join(this.getVersionsPath(), `${profile.safename} [Minecraft Manager]`))) {
                rimraf(path.join(this.getVersionsPath(), `${profile.safename} [Minecraft Manager]`), () => {
                    resolve();
                })
            }else{
                resolve();
            }
        })
    },
    cleanVersions: function() {
        LogManager.log('info', `[VersionsManager] [CleanVersions] Cleaning Launcher Versions...`);
        fs.readdirSync(this.getVersionsPath()).forEach(file => {
            if(file.indexOf('[Minecraft Manager]') !== -1) {
                if(!ProfilesManager.loadedProfiles.find(prof => prof.versionname === file)) {
                    rimraf.sync(path.join(this.getVersionsPath(), file));
                    LogManager.log('info', `[VersionsManager] [CleanVersions] Removed version ${file}`);
                }
            }
        })
    }
}

export default VersionsManager;