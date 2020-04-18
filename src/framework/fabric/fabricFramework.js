import path from 'path';
import fs from 'fs';
import VersionsManager from '../../manager/versionsManager';
import HTTPRequest from '../../host/httprequest';
import DownloadsManager from '../../manager/downloadsManager';
import LibrariesManager from '../../manager/librariesManager';
import ToastManager from '../../manager/toastManager';
import LauncherManager from '../../manager/launcherManager';
import logInit from '../../util/logger';

const logger = logInit('FabricFramework');

const FabricFramework = {
  setupFabric: profile =>
    new Promise(async resolve => {
      logger.info(`Beginning install of Fabric ${profile.frameworks.fabric.version} to ${profile.id}`);
      const versionMeta = (
        await HTTPRequest.get(
          `https://meta.fabricmc.net/v2/versions/loader/${profile.version.minecraft.version}/${profile.frameworks.fabric.version}`
        )
      ).data;
      VersionsManager.createVersion(profile, 'fabric', versionMeta);

      const libraryPath = path.join(LibrariesManager.getMCMLibraries(), `/mcm-${profile.id}`);

      if (!fs.existsSync(libraryPath)) {
        fs.mkdirSync(libraryPath);
      }

      logger.info(`Creating Fabric Library paths for ${profile.id}`);
      fs.mkdirSync(path.join(libraryPath, '/fabric-intermediary'));
      fs.mkdirSync(path.join(libraryPath, '/fabric-loader'));

      logger.info(`Starting download of Fabric Intermediary for ${profile.id}`);
      DownloadsManager.startFileDownload(
        `Fabric Intermediary\n_A_${profile.name}`,
        `https://maven.fabricmc.net/net/fabricmc/intermediary/${profile.version.minecraft.version}/intermediary-${profile.version.minecraft.version}.jar`,
        path.join(libraryPath, `fabric-intermediary/mcm-${profile.id}-fabric-intermediary.jar`)
      );

      logger.info(`Starting download of Fabric Loader for ${profile.id}`);
      DownloadsManager.startFileDownload(
        `Fabric Loader\n_A_${profile.name}`,
        `https://maven.fabricmc.net/net/fabricmc/fabric-loader/${profile.frameworks.fabric.version}/fabric-loader-${profile.frameworks.fabric.version}.jar`,
        path.join(libraryPath, `fabric-loader/mcm-${profile.id}-fabric-loader.jar`)
      );

      resolve();
    }),
  uninstallFabric: profile =>
    new Promise(resolve => {
      logger.info(`Beginning uninstall of Fabric from ${profile.id}`);
      LibrariesManager.deleteLibrary(profile).then(() => {
        VersionsManager.deleteVersion(profile).then(() => {
          LauncherManager.setProfileData(profile, 'lastVersionId', profile.version.minecraft.version);
          profile.removeFramework('fabric');
          resolve();
        });
      });
    }),
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
    })
};

export default FabricFramework;
