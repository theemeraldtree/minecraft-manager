import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import Global from '../util/global';
import LauncherManager from './launcherManager';
import ProfilesManager from './profilesManager';
import LogManager from './logManager';

const semver = require('semver');
const defaultVersionForge = require('../assets/defaultVersion.json');
const defaultVersionFabric = require('../assets/defaultVersionFabric.json');
const version1710 = require('../assets/1710version.json');

const VersionsManager = {
  getVersionsPath() {
    return path.join(Global.getMCPath(), '/versions');
  },
  createVersion(profile, type, meta) {
    const versionname = `${profile.safename} [Minecraft Manager]`;
    if (!fs.existsSync(path.join(this.getVersionsPath(), versionname))) {
      fs.mkdirSync(path.join(this.getVersionsPath(), versionname));
    }
    let obj;
    if (type === 'forge') {
      obj = defaultVersionForge;
      if (this.checkIs1710OrLower(profile)) {
        obj = version1710;
      }
      obj.id = versionname;
      obj.inheritsFrom = profile.version.minecraft.version;
      obj.jar = profile.version.minecraft.version;
      obj.assets = profile.version.minecraft.version;
      obj.libraries[0].name = `minecraftmanager.profiles:mcm-${profile.id}:forge`;
    } else if (type === 'forgeComplex') {
      obj = meta.version;
      obj.time = undefined;
      obj.releaseTime = undefined;
      obj.libraries[0] = {
        name: `minecraftmanager.profiles:mcm-${profile.id}:forge`
      };
      obj.id = versionname;
      obj.jar = profile.version.minecraft.version;
    } else if (type === 'fabric') {
      obj = defaultVersionFabric;
      obj.libraries = meta.launcherMeta.libraries.common;
      obj.id = versionname;
      obj.jar = profile.version.minecraft.version;
      obj.inheritsFrom = profile.version.minecraft.version;

      obj.libraries.push({
        name: `minecraftmanager.profiles:mcm-${profile.id}:fabric-intermediary`,
        url: 'https://maven.fabricmc.net'
      });
      obj.libraries.push({
        name: `minecraftmanager.profiles:mcm-${profile.id}:fabric-loader`,
        url: 'https://maven.fabricmc.net'
      });
    }
    fs.writeFile(path.join(this.getVersionsPath(), versionname, `${versionname}.json`), JSON.stringify(obj), () => {
      LauncherManager.setProfileData(profile, 'lastVersionId', versionname);
    });
  },
  checkIs1710OrLower(profile) {
    const ver = profile.version.minecraft.version;
    switch (ver) {
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
  checkIs113OrHigher(profile) {
    let { version } = profile.version.minecraft;
    if (version.split('.').length === 2) {
      const arr = version.split('.');
      arr.push('0');
      version = arr.join('.');
    }
    return semver.gte(version, '1.13.0');
  },
  renameVersion(profile, newName, type) {
    const oldVersionName = `${profile.safename} [Minecraft Manager]`;
    const newVersionName = `${newName} [Minecraft Manager]`;

    const oldVersionPath = path.join(this.getVersionsPath(), oldVersionName);
    const newVersionPath = path.join(this.getVersionsPath(), newVersionName);

    if (fs.existsSync(oldVersionPath)) {
      const oldJSON = JSON.parse(fs.readFileSync(path.join(oldVersionPath, `/${oldVersionName}.json`)));
      oldJSON.id = newVersionName;

      if (type === 'forge' || type === 'forgeComplex') {
        // old library method
        if (oldJSON.libraries[0].name.includes('minecraftmanager:profiles')) {
          oldJSON.libraries[0].name = `minecraftmanager:profiles:mcm-${Global.createID(newName)}`;
        } else {
          oldJSON.libraries[0].name = `minecraftmanager.profiles:mcm-${Global.createID(newName)}:forge`;
        }
      } else if (type === 'fabric') {
        oldJSON.libraries[oldJSON.libraries.length - 1].name = `minecraftmanager.profiles:mcm-${Global.createID(
          newName
        )}:fabric-loader`;
        oldJSON.libraries[oldJSON.libraries.length - 2].name = `minecraftmanager.profiles:mcm-${Global.createID(
          newName
        )}:fabric-intermediary`;
      }

      fs.writeFileSync(path.join(oldVersionPath, `/${oldVersionName}.json`), JSON.stringify(oldJSON));

      fs.renameSync(
        path.join(oldVersionPath, `/${oldVersionName}.json`),
        path.join(oldVersionPath, `/${newVersionName}.json`)
      );
      fs.renameSync(oldVersionPath, newVersionPath);
    }
  },
  dumpAllVersions() {
    const final = [];
    fs.readdirSync(this.getVersionsPath()).forEach(file => {
      final.push(file);
    });
    return final;
  },
  deleteVersion(profile) {
    return new Promise(resolve => {
      if (fs.existsSync(path.join(this.getVersionsPath(), `${profile.safename} [Minecraft Manager]`))) {
        rimraf(path.join(this.getVersionsPath(), `${profile.safename} [Minecraft Manager]`), () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  },
  cleanVersions() {
    LogManager.log('info', '[VersionsManager] [CleanVersions] Cleaning Launcher Versions...');
    fs.readdirSync(this.getVersionsPath()).forEach(file => {
      if (file.indexOf('[Minecraft Manager]') !== -1) {
        if (!ProfilesManager.loadedProfiles.find(prof => prof.versionname === file)) {
          rimraf.sync(path.join(this.getVersionsPath(), file));
          LogManager.log('info', `[VersionsManager] [CleanVersions] Removed version ${file}`);
        }
      }
    });
  }
};

export default VersionsManager;
