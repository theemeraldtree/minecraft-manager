import path from 'path';
import fs from 'fs';
import os from 'os';
import exec from 'child_process';
import Global from '../util/global';
import ProfilesManager from './profilesManager';
import SettingsManager from './settingsManager';
import logInit from '../util/logger';

const logger = logInit('LauncherManager');

const LauncherManager = {
  DEFAULT_JAVA_ARGS:
    '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M',
  getLauncherProfiles() {
    return path.join(Global.getMCPath(), '/launcher_profiles.json');
  },
  profileExists(profile) {
    const id = `mcm-${profile.id}`;
    const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
    if (obj.profiles[id]) {
      return true;
    }
    return false;
  },
  updateVersion(profile) {
    logger.info(`Updating Launcher Profile version for ${profile.id}`);
    let verId;
    if (profile.hasFramework()) {
      verId = `${profile.safename} [Minecraft Manager]`;
    } else if (profile.id === '0-default-profile-latest') {
      verId = 'latest-release';
    } else if (profile.id === '0-default-profile-snapshot') {
      verId = 'latest-snapshot';
    } else {
      verId = profile.version.minecraft.version;
    }
    this.setProfileData(profile, 'lastVersionId', verId);
  },
  dumpAllProfiles() {
    return JSON.parse(fs.readFileSync(this.getLauncherProfiles())).profiles;
  },
  createProfile(profile) {
    if (!profile.isDefaultProfile) {
      logger.info(`Creating Launcher Profile for ${profile.id}`);
      const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
      obj.profiles[`mcm-${profile.id}`] = {
        name: profile.name,
        type: 'custom',
        gameDir: path.join(profile.gameDir),
        lastVersionId: profile.version.minecraft.version,
        lastUsed: new Date().toISOString(),
        javaArgs: `-Xmx${SettingsManager.currentSettings.dedicatedRam}G ${this.DEFAULT_JAVA_ARGS}`
      };
      fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
    }
  },
  deleteProfile(profile) {
    logger.info(`Deleting Launcher Profile for ${profile.id}`);
    const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
    delete obj.profiles[`mcm-${profile.id}`];
    fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
  },
  renameProfile(profile, newID) {
    logger.info(`Renaming Launcher Profile for ${profile.id}`);
    const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
    const oldID = `mcm-${profile.id}`;
    const oldData = obj.profiles[oldID];
    obj.profiles[`mcm-${newID}`] = oldData;
    delete obj.profiles[oldID];
    obj.profiles[`mcm-${newID}`].gameDir = path.join(Global.PROFILES_PATH, `/${newID}/files`);
    fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
  },
  setProfileData(profile, tag, val) {
    const id = `mcm-${profile.id}`;
    const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));

    if (tag !== 'icon') {
      logger.info(`Setting "${tag}" of ${profile.id} to "${val}"`);
    } else {
      logger.info(`Setting "icon" of ${profile.id} to [icon base64 string]`);
    }

    if (!profile.isDefaultProfile) {
      if (obj.profiles[id]) {
        obj.profiles[id][tag] = val;
      }
    } else if (profile.id === '0-default-profile-latest') {
      const find = Object.keys(obj.profiles).find(prof => obj.profiles[prof].type === 'latest-release');
      obj.profiles[find][tag] = val;
    } else if (profile.id === '0-default-profile-snapshot') {
      const find = Object.keys(obj.profiles).find(prof => obj.profiles[prof].type === 'latest-snapshot');
      obj.profiles[find][tag] = val;
    }
    fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
  },
  setMostRecentProfile(profile) {
    logger.info(`Setting most recent profile to ${profile.id}`);
    const date = new Date();
    const iso = date.toISOString();
    this.setProfileData(profile, 'lastUsed', iso);
    this.setProfileData(profile, 'gameDir', profile.gameDir);
  },
  updateGameDir(profile) {
    this.setProfileData(profile, 'gameDir', profile.gameDir);
  },
  openLauncher() {
    logger.info('Opening launcher');
    const launcherPath = Global.getLauncherPath();
    if (os.platform() === 'win32') {
      exec.exec(`"${launcherPath}"`);
    } else if (os.platform() === 'darwin') {
      exec.exec(`open -a ${launcherPath}`);
    } else if (os.platform() === 'linux') {
      exec.exec(`${launcherPath}`);
    }
  },
  setLaunchArguments(profile, args) {
    this.setProfileData(profile, 'javaArgs', args);
  },
  setDedicatedRam(amount) {
    logger.info('Setting Dedicated RAM');
    ProfilesManager.loadedProfiles.forEach(profile => {
      this.setLaunchArguments(profile, `-Xmx${amount}G ${this.DEFAULT_JAVA_ARGS}`);
    });
  },
  cleanMinecraftProfiles() {
    logger.info('Cleaning Minecraft profiles...');
    const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
    Object.keys(obj.profiles).forEach(key => {
      if (key.substring(0, 4) === 'mcm-') {
        if (!ProfilesManager.loadedProfiles.find(prof => key === `mcm-${prof.id}`)) {
          delete obj.profiles[key];
          logger.info(`Removed profile key ${key}`);
        }
      }
    });

    logger.info('Saving changes to disk...');
    fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
  }
};

export default LauncherManager;
