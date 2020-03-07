import path from 'path';
import fs from 'fs';
import HTTPRequest from '../host/httprequest';
import VersionsManager from './versionsManager';
import DownloadsManager from './downloadsManager';
import LibrariesManager from './librariesManager';
import LauncherManager from './launcherManager';
import ToastManager from './toastManager';

const FabricManager = {
  setupFabric: profile =>
    new Promise(async resolve => {
      const versionMeta = JSON.parse(
        await HTTPRequest.get(
          `https://meta.fabricmc.net/v2/versions/loader/${profile.minecraftversion}/${profile.customVersions.fabric.version}`
        )
      );
      VersionsManager.createVersionFabric(profile, versionMeta);

      const libraryPath = path.join(LibrariesManager.getMCMLibraries(), `/mcm-${profile.id}`);
      if (!fs.existsSync(libraryPath)) {
        fs.mkdirSync(libraryPath);
      }

      fs.mkdirSync(path.join(libraryPath, '/fabric-intermediary'));
      fs.mkdirSync(path.join(libraryPath, '/fabric-loader'));

      DownloadsManager.startFileDownload(
        `Fabric Intermediary\n_A_${profile.name}`,
        `https://maven.fabricmc.net/net/fabricmc/intermediary/${profile.minecraftversion}/intermediary-${profile.minecraftversion}.jar`,
        path.join(libraryPath, `fabric-intermediary/mcm-${profile.id}-fabric-intermediary.jar`)
      );

      DownloadsManager.startFileDownload(
        `Fabric Loader\n_A_${profile.name}`,
        `https://maven.fabricmc.net/net/fabricmc/fabric-loader/${profile.customVersions.fabric.version}/fabric-loader-${profile.customVersions.fabric.version}.jar`,
        path.join(libraryPath, `fabric-loader/mcm-${profile.id}-fabric-loader.jar`)
      );

      resolve();
    }),
  uninstallFabric: profileT =>
    new Promise(resolve => {
      const profile = profileT;
      LibrariesManager.deleteLibrary(profile).then(() => {
        VersionsManager.deleteVersion(profile).then(() => {
          LauncherManager.setProfileData(profile, 'lastVersionId', profile.minecraftversion);
          delete profile.customVersions.fabric;
          profile.save();
          resolve();
        });
      });
    }),
  getFabricLoaderVersions: mcversion =>
    new Promise((resolve, reject) => {
      HTTPRequest.httpGet(`https://meta.fabricmc.net/v2/versions/loader/${mcversion}`).then(versions => {
        if (versions) {
          resolve(JSON.parse(versions));
        } else {
          reject();
          ToastManager.createToast(
            'Error',
            "We can't reach the Fabric servers. Check your internet connection, and try again."
          );
        }
      });
    })
};

export default FabricManager;
