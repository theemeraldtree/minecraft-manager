import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import FSU from '../util/fsu';
import LauncherManager from '../manager/launcherManager';
import MCAccountsHandler from './mcAccountsHandler';
import ProfilesManager from '../manager/profilesManager';
import SettingsManager from '../manager/settingsManager';
import Global from '../util/global';
import LibrariesManager from '../manager/librariesManager';
import MCVersionHandler from './mcVersionHandler';
import JavaHandler from './javaHandler';
import VersionsManager from '../manager/versionsManager';

const MCLauncherIntegrationHandler = {
  integrateAccounts() {
    return new Promise(async (resolve, reject) => {
      try {
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
      } catch (e) {
        reject(e);
      }
    });
  },
  integrateFirst() {
    return new Promise(async (resolve, reject) => {
      try {
        const launcherProfiles = await FSU.readJSON(LauncherManager.getLauncherProfiles());

        if (launcherProfiles.settings.enableSnapshots !== SettingsManager.currentSettings.allowSnapshotProfile) {
          SettingsManager.currentSettings.allowSnapshotProfile = launcherProfiles.settings.enableSnapshots;
        }

        if (!MCAccountsHandler.getAccountFromUUID(SettingsManager.currentSettings.activeAccount)) {
          if (SettingsManager.currentSettings.accounts.length) {
            SettingsManager.currentSettings.activeAccount = SettingsManager.currentSettings.accounts[0].uuid;
          }
        }

        SettingsManager.save();

        resolve();
      } catch (e) {
        reject(e);
      }
    });
  },
  async updateSnapshotEnabled() {
    const launcherProfiles = await FSU.readJSON(LauncherManager.getLauncherProfiles());

    launcherProfiles.settings.enableSnapshots = SettingsManager.currentSettings.allowSnapshotProfile;

    fs.writeFileSync(LauncherManager.getLauncherProfiles(), JSON.stringify(launcherProfiles));
  },
  integrateProfiles(initial) {
    return new Promise(async (resolve, reject) => {
      let launcherProfiles;

      try {
        launcherProfiles = await FSU.readJSON(LauncherManager.getLauncherProfiles());
      } catch (e) {
        reject(e);
        return;
      }
      const setData = (profile, tag, val) => {
        if (profile.id === '0-default-profile-latest') {
          const find = Object.keys(launcherProfiles.profiles).find(prof => launcherProfiles.profiles[prof].type === 'latest-release');
          launcherProfiles.profiles[find][tag] = val;
        } else if (profile.id === '0-default-profile-snapshot') {
          const find = Object.keys(launcherProfiles.profiles).find(prof => launcherProfiles.profiles[prof].type === 'latest-snapshot');
          launcherProfiles.profiles[find][tag] = val;
        } else {
          launcherProfiles.profiles[`mcm-${profile.id}`][tag] = val;
        }
      };


      await Promise.all(ProfilesManager.loadedProfiles.map(async profile => new Promise(async res => {
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
            setData(profile, 'lastVersionId', profile.versionname);

            if (initial) {
              setData(profile, 'icon', await profile.getIconBase64());
            }
          }

          if (profile.id === '0-default-profile-latest' && initial) {
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
          if (profile.mcm.java && profile.mcm.java.overrideArgs) {
            remainingArgs += `${profile.mcm.java.customArgs}`;
          }

          let ramAmount = SettingsManager.currentSettings.dedicatedRam;
          if (profile.mcm.java && profile.mcm.java.overrideRam) {
            ramAmount = profile.mcm.java.dedicatedRam;
          }

          const defaultArgs = '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M';

          setData(profile, 'javaArgs', `-Xmx${ramAmount}G ${remainingArgs || defaultArgs}`);
          setData(profile, 'javaDir', JavaHandler.getJavaPath(profile));

          LauncherManager.updateGameDir(profile);


          res();
        })));

      SettingsManager.save();
      ProfilesManager.updateReloadListeners();
      fs.writeFileSync(LauncherManager.getLauncherProfiles(), JSON.stringify(launcherProfiles));
      resolve();
    });
  },
  integrateLibraries() {
    FSU.createDirIfMissing(path.join(Global.getMCPath(), '/libraries/'));

    if (!fs.existsSync(path.join(Global.getMCPath(), '/libraries/minecraftmanager'))) {
      fs.symlinkSync(path.join(LibrariesManager.getLibrariesPath(), '/minecraftmanager/'), path.join(Global.getMCPath(), '/libraries/minecraftmanager/'), 'junction');
    }

    FSU.createDirIfMissing(path.join(Global.getMCPath(), '/libraries/net/minecraftforge/forge/'));
    ProfilesManager.loadedProfiles.forEach(profile => {
      // 1.13 or newer Forge requires the client and universal exist in the libraries folder
      // this properly links the Minecraft Manager libraries and Minecraft Launcher libraries
      if (profile.getPrimaryFramework() === 'forge' && VersionsManager.checkIs113OrHigher(profile)) {
        const forgeBasePath = `/net/minecraftforge/forge/${profile.frameworks.forge.version}`;
        const forgePath = path.join(Global.getMCPath(), `/libraries/${forgeBasePath}`);

        FSU.createDirIfMissing(forgePath);

        const clientPath = path.join(LibrariesManager.getLibrariesPath(), forgeBasePath, `/forge-${profile.frameworks.forge.version}-client.jar`);
        if (fs.existsSync(clientPath)) {
          FSU.updateSymlink(
            path.join(forgePath, `/forge-${profile.frameworks.forge.version}-client.jar`),
            clientPath
          );
        }

        const universalPath = path.join(LibrariesManager.getLibrariesPath(), forgeBasePath, `/forge-${profile.frameworks.forge.version}-universal.jar`);

        if (fs.existsSync(universalPath)) {
          FSU.updateSymlink(
            path.join(forgePath, `/forge-${profile.frameworks.forge.version}-universal.jar`),
            universalPath
          );
        }
      }
    });
  },
  integrate(initial) {
    this.integrateAccounts().catch(e => { throw e; });
    this.integrateProfiles(initial).catch(e => { throw e; });
    this.integrateLibraries().catch(e => { throw e; });
  },
  removeIntegration() {
    if (fs.existsSync(path.join(Global.getMCPath(), '/libraries/minecraftmanager'))) {
      rimraf.sync(path.join(Global.getMCPath(), '/libraries/minecraftmanager'));
    }

    ProfilesManager.loadedProfiles.forEach(profile => {
      MCVersionHandler.deleteLauncherIntegration(profile);
      LauncherManager.deleteProfile(profile);

      if (profile.id === '0-default-profile-latest') {
        LauncherManager.setProfileData(profile, 'javaArgs', SettingsManager.currentSettings.prevLauncherLatestArgs);
        LauncherManager.setProfileData(profile, 'gameDir', undefined);
        LauncherManager.setProfileData(profile, 'javaDir', undefined);
      } else if (profile.id === '0-default-profile-snapshot') {
        LauncherManager.setProfileData(profile, 'javaArgs', SettingsManager.currentSettings.prevLauncherSnapshotArgs);
        LauncherManager.setProfileData(profile, 'gameDir', undefined);
        LauncherManager.setProfileData(profile, 'javaDir', undefined);
      }
    });
  }
};

export default MCLauncherIntegrationHandler;
