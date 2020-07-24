import path from 'path';
import mkdirp from 'mkdirp';
import VersionsManager from '../../manager/versionsManager';
import HTTPRequest from '../../host/httprequest';
import DownloadsManager from '../../manager/downloadsManager';
import LibrariesManager from '../../manager/librariesManager';
import ToastManager from '../../manager/toastManager';
import LauncherManager from '../../manager/launcherManager';
import logInit from '../../util/logger';
import MCVersionHandler from '../../minecraft/mcVersionHandler';
import FSU from '../../util/fsu';
import SettingsManager from '../../manager/settingsManager';

const logger = logInit('FabricFramework');

const FabricFramework = {
  setupFabric(profile) {
    return new Promise(async (resolve, reject) => {
      logger.info(`Beginning install of Fabric ${profile.frameworks.fabric.version} to ${profile.id}`);
      profile.setFrameworkIsInstalling('fabric');

      MCVersionHandler.updateProfile(profile);

      const libraryPath = path.join(LibrariesManager.getMCMLibraries(), `/mcm-${profile.id}`);

      FSU.createDirIfMissing(libraryPath);

      logger.info(`Creating Fabric Library paths for ${profile.id}`);
      mkdirp.sync(path.join(libraryPath, '/fabric-intermediary'));
      mkdirp.sync(path.join(libraryPath, '/fabric-loader'));

      let intermediaryDone, loaderDone;

      const checkDone = () => {
        if (intermediaryDone && loaderDone) {
          profile.unsetFrameworkIsInstalling('fabric');
          resolve();
        }
      };

      logger.info(`Starting download of Fabric Intermediary for ${profile.id}`);
      DownloadsManager.startFileDownload(
        `Fabric Intermediary\n_A_${profile.name}`,
        `https://maven.fabricmc.net/net/fabricmc/intermediary/${profile.version.minecraft.version}/intermediary-${profile.version.minecraft.version}.jar`,
        path.join(libraryPath, `fabric-intermediary/mcm-${profile.id}-fabric-intermediary.jar`)
      ).then(() => {
        intermediaryDone = true;
        checkDone();
      }).catch(async e => {
        await this.uninstallFabric(profile);
        reject(e);
      });

      logger.info(`Starting download of Fabric Loader for ${profile.id}`);
      DownloadsManager.startFileDownload(
        `Fabric Loader\n_A_${profile.name}`,
        `https://maven.fabricmc.net/net/fabricmc/fabric-loader/${profile.frameworks.fabric.version}/fabric-loader-${profile.frameworks.fabric.version}.jar`,
        path.join(libraryPath, `fabric-loader/mcm-${profile.id}-fabric-loader.jar`)
      ).then(() => {
        loaderDone = true;
        checkDone();
      }).catch(async e => {
        await this.uninstallFabric(profile);
        reject(e);
      });
    });
  },
  uninstallFabric(profile) {
    return new Promise(resolve => {
      logger.info(`Beginning uninstall of Fabric from ${profile.id}`);
      LibrariesManager.deleteLibrary(profile).then(() => {
        VersionsManager.deleteVersion(profile).then(() => {
          if (SettingsManager.currentSettings.launcherIntegration) LauncherManager.setProfileData(profile, 'lastVersionId', profile.version.minecraft.version);
          profile.removeFramework('fabric');
          resolve();
        });
      });
    });
  },
  getFabricLoaderVersions: mcversion =>
    new Promise((resolve, reject) => {
      logger.info('Downloading Fabric Loader versions...');
      HTTPRequest.get(`https://meta.fabricmc.net/v2/versions/loader/${mcversion}`)
        .then(versions => {
          if (versions && versions.data) {
            logger.info('Successfully downloaded Fabric Loader versions');
            resolve(versions.data);
          } else {
            logger.error('Unable to download Fabric Loader versions');
            reject();
            ToastManager.createToast(
              'Error',
              "We can't reach the Fabric servers. Check your internet connection, and try again."
            );
          }
        })
        .catch(err => {
          reject(err);
        });
    }),
  getVersionJSON: async (profile) => {
    if (profile.frameworks?.fabric?.version) {
      const rawVersion = (await HTTPRequest.get(`https://meta.fabricmc.net/v2/versions/loader/${profile.version.minecraft.version}/${profile.frameworks.fabric.version}`)).data;
      const { launcherMeta } = rawVersion;

      const combinedLibs = [...launcherMeta.libraries.client, ...launcherMeta.libraries.common];
      combinedLibs.push({
        name: `minecraftmanager.profiles:mcm-${profile.id}:fabric-loader`
      });

      combinedLibs.push({
        name: `minecraftmanager.profiles:mcm-${profile.id}:fabric-intermediary`
      });

      return {
        _priority: 1,
        mainClass: launcherMeta.mainClass.client,
        '+libraries': combinedLibs
      };
    }

    return undefined;
  }
};

export default FabricFramework;
