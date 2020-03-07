import path from 'path';
import fs from 'fs';
import os from 'os';
import exec from 'child_process';
import Global from '../util/global';
import ProfilesManager from './profilesManager';
import SettingsManager from './settingsManager';
import LogManager from './logManager';

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
    let verId;
    if (profile.hasFramework()) {
      verId = `${profile.safename} [Minecraft Manager]`;
    } else {
      verId = profile.version.minecraft.version;
    }
    this.setProfileData(profile, 'lastVersionId', verId);
  },
  createProfile(profile) {
    const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
    obj.profiles[`mcm-${profile.id}`] = {
      name: profile.name,
      type: 'custom',
      gameDir: path.join(profile.gameDir),
      lastVersionId: profile.version.minecraft.version,
      lastUsed: new Date().toISOString(),
      javaArgs: `-Xmx${SettingsManager.currentSettings.dedicatedRam}G ${this.DEFAULT_JAVA_ARGS}`,
    };
    fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
  },
  deleteProfile(profile) {
    const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
    delete obj.profiles[`mcm-${profile.id}`];
    fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
  },
  renameProfile(profile, newID) {
    const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
    const oldID = `mcm-${profile.id}`;
    const oldData = obj.profiles[oldID];
    obj.profiles[`mcm-${newID}`] = oldData;
    delete obj.profiles[oldID];
    obj.profiles[`mcm-${newID}`].gameDir = path.join(
      Global.PROFILES_PATH,
      `/${newID}/files`
    );
    fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
  },
  setProfileData(profile, tag, val) {
    const id = `mcm-${profile.id}`;
    const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
    if (obj.profiles[id]) {
      obj.profiles[id][tag] = val;
    }
    fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
  },
  setMostRecentProfile(profile) {
    const date = new Date();
    const iso = date.toISOString();
    this.setProfileData(profile, 'lastUsed', iso);
  },
  openLauncher() {
    const launcherPath = Global.getLauncherPath();
    if (os.platform() === 'win32') {
      exec.exec(`"${launcherPath}"`);
    } else if (os.platform() === 'darwin') {
      exec.exec(`open -a ${launcherPath}`);
    }
  },
  setLaunchArguments(profile, args) {
    this.setProfileData(profile, 'javaArgs', args);
  },
  setDedicatedRam(amount) {
    for (const profile of ProfilesManager.loadedProfiles) {
      this.setLaunchArguments(
        profile,
        `-Xmx${amount}G ${this.DEFAULT_JAVA_ARGS}`
      );
    }
  },
  cleanMinecraftProfiles() {
    LogManager.log(
      'info',
      '[LauncherManager] [CleanMinecraftProfiles] Starting clean...'
    );
    const obj = JSON.parse(fs.readFileSync(this.getLauncherProfiles()));
    Object.keys(obj.profiles).forEach(key => {
      if (key.substring(0, 4) === 'mcm-') {
        if (
          !ProfilesManager.loadedProfiles.find(prof => key === `mcm-${prof.id}`)
        ) {
          delete obj.profiles[key];
          LogManager.log(
            'info',
            `[LauncherManager] [CleanMinecraftProfiles] Removed profile key ${key}`
          );
        }
      }
    });
    LogManager.log(
      'info',
      '[LauncherManager] [CleanMinecraftProfiles] Writing changes...'
    );
    fs.writeFileSync(this.getLauncherProfiles(), JSON.stringify(obj));
    LogManager.log(
      'info',
      '[LauncherManager] [CleanMinecraftProfiles] Successfully written'
    );
  },
};

export default LauncherManager;
