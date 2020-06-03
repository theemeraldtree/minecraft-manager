/* eslint-disable */
import fs from 'fs';
import path from 'path';
import FSU from '../util/fsu';
import LauncherManager from '../manager/launcherManager';
import MCAccountsHandler from './mcAccountsHandler';
import ProfilesManager from '../manager/profilesManager';
import SettingsManager from '../manager/settingsManager';
import Global from '../util/global';
import LibrariesManager from '../manager/librariesManager';
import MCVersionHandler from './mcVersionHandler';
import JavaHandler from './javaHandler';
import rimraf from 'rimraf';
import VersionsManager from '../manager/versionsManager';

const MCLauncherIntegrationHandler = {
  integrateAccounts() {
    return new Promise(async resolve => {
      const launcherProfiles = await FSU.readJSON(LauncherManager.getLauncherProfiles());
      if (launcherProfiles.authenticationDatabase) {
        await Promise.all(Object.keys(launcherProfiles.authenticationDatabase).map(authdName => {
          const authd = launcherProfiles.authenticationDatabase[authdName];
          const existing = MCAccountsHandler.getAccountByEmail(authd.username);
          if (!existing) {
            return MCAccountsHandler.addAccountLauncher(authd.username, authd.accessToken, Object.keys(authd.profiles)[0]);
          }

          return undefined;
        }));
      }

      resolve();
    });
  },
  async integrateProfiles(initial) {
    const launcherProfiles = await FSU.readJSON(LauncherManager.getLauncherProfiles());

    const setData = (profile, tag, val) => {
      console.log(`setting ${profile.id} ${tag} to ${val}`);
      if (profile.id === '0-default-profile-latest') {
        const find = Object.keys(launcherProfiles.profiles).find(prof => launcherProfiles.profiles[prof].type === 'latest-release');
        launcherProfiles.profiles[find][tag] = val;
      } else if (profile.id === '0-default-profile-snapshot') {
        const find = Object.keys(launcherProfiles.profiles).find(prof => launcherProfiles.profiles[prof].type === 'latest-snapshot');
        launcherProfiles.profiles[find][tag] = val;
      } else {
        console.log(profile.id);
        launcherProfiles.profiles[`mcm-${profile.id}`][tag] = val;
      }
    };


    await Promise.all(ProfilesManager.loadedProfiles.map(async profile => new Promise(async resolve => {
        if (profile.id !== '0-default-profile-latest' && profile.id !== '0-default-profile-snapshot') {
          if (!launcherProfiles.profiles[`mcm-${profile.id}`]) {
            launcherProfiles.profiles[`mcm-${profile.id}`] = {
              name: profile.name,
              type: 'custom',
              gameDir: profile.gameDir,
              lastUsed: new Date().toISOString()
            };
          }
  
          if (!fs.existsSync(path.join(profile.mcmPath, '/version.json'))) {
            await MCVersionHandler.updateProfile(profile);
          }

          MCVersionHandler.createLauncherIntegration(profile);
          console.log(profile);
          setData(profile, 'lastVersionId', profile.versionname);

          if(initial) {
            setData(profile, 'icon', await profile.getIconBase64());
          }
        }

        if(profile.id === '0-default-profile-latest' && initial) {
          SettingsManager.currentSettings.prevLauncherLatestArgs = launcherProfiles.profiles[Object.keys(launcherProfiles.profiles).find(prof => launcherProfiles.profiles[prof].type === 'latest-release')].javaArgs;

          SettingsManager.save();
        } else if (profile.id === '0-default-profile-snapshot' && initial) {
          SettingsManager.currentSettings.prevLauncherSnapshotArgs = launcherProfiles.profiles[Object.keys(launcherProfiles.profiles).find(prof => launcherProfiles.profiles[prof].type === 'latest-snapshot')].javaArgs;

          SettingsManager.save();
        }
        

        let remainingArgs = '';
        if (SettingsManager.currentSettings.java.customArgsActive && !profile.mcm.java.overrideArgs) {
          remainingArgs += `${SettingsManager.currentSettings.java.customJavaArgs}`;
        }
        if (profile.mcm.java.overrideArgs) {
          remainingArgs += `${profile.mcm.java.customArgs}`;
        }

        const ramAmount = profile.mcm.java.overrideRam ? profile.mcm.java.dedicatedRam : SettingsManager.currentSettings.dedicatedRam;

        const defaultArgs = '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M';

        setData(profile, 'javaArgs', `-Xmx${ramAmount}G ${remainingArgs || defaultArgs}`);
        setData(profile, 'javaDir', JavaHandler.getJavaPath(profile));

        console.log(profile.gameDir);
        setData(profile, 'gameDir', profile.gameDir); 
        
        resolve();
      })));

      fs.writeFileSync(LauncherManager.getLauncherProfiles(), JSON.stringify(launcherProfiles));
  },
  integrateLibraries() {
    if (!fs.existsSync(path.join(Global.getMCPath(), '/libraries/minecraftmanager'))) {
      console.log('create smylink');
      fs.symlinkSync(path.join(LibrariesManager.getLibrariesPath(), '/minecraftmanager/'), path.join(Global.getMCPath(), '/libraries/minecraftmanager/'), 'junction');
    }
  },
  integrate(initial) {
    this.integrateAccounts();
    this.integrateProfiles(initial);
    this.integrateLibraries();
  },
  removeIntegration() {
    if(fs.existsSync(path.join(Global.getMCPath(), '/libraries/minecraftmanager'))) {
      rimraf.sync(path.join(Global.getMCPath(), '/libraries/minecraftmanager'));
    }

    ProfilesManager.loadedProfiles.forEach(profile => {
      MCVersionHandler.deleteLauncherIntegration(profile);
      LauncherManager.deleteProfile(profile);

      if(profile.id === '0-default-profile-latest') {
        LauncherManager.setProfileData(profile, 'javaArgs', SettingsManager.currentSettings.prevLauncherLatestArgs);
        LauncherManager.setProfileData(profile, 'gameDir', undefined);
        LauncherManager.setProfileData(profile, 'javaDir', undefined);
      } else if (profile.id === '0-default-profile-snapshot') {
        LauncherManager.setProfileData(profile, 'javaArgs', SettingsManager.currentSettings.prevLauncherSnapshotArgs);
        LauncherManager.setProfileData(profile, 'gameDir', undefined);
        LauncherManager.setProfileData(profile, 'javaDir', undefined);
      }
    })
  }
};

export default MCLauncherIntegrationHandler;
