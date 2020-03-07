import fs from 'fs';
import path from 'path';
import VersionsManager from '../../manager/versionsManager';
import LibrariesManager from '../../manager/librariesManager';
import DownloadsManager from '../../manager/downloadsManager';
import ForgeComplex from './forgeComplex';
import LauncherManager from '../../manager/launcherManager';
import HTTPRequest from '../../host/httprequest';

const ForgeFramework = {
  setupForge: profile =>
    new Promise(resolve => {
      if (VersionsManager.checkIs113OrHigher(profile)) {
        // we are version 1.13 or higher
        // we have to do the hard forge install process

        ForgeComplex.setupForge(profile, resolve);
      } else {
        VersionsManager.createVersion(profile, 'forge');

        const libraryPath = LibrariesManager.createLibraryPath(profile);

        const forgePath = path.join(libraryPath, 'forge');
        if (!fs.existsSync(forgePath)) {
          fs.mkdirSync(forgePath);
        }

        const mcversion = profile.version.minecraft.version;
        let downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.frameworks.forge.version}/forge-${profile.frameworks.forge.version}-universal.jar`;
        if (mcversion === '1.7.10') {
          downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.frameworks.forge.version}-1.7.10/forge-${profile.frameworks.forge.version}-1.7.10-universal.jar`;
        } else if (
          mcversion === '1.8.9' ||
          mcversion === '1.8.8' ||
          mcversion === '1.8'
        ) {
          downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.frameworks.forge.version}-${mcversion}/forge-${profile.frameworks.forge.version}-${mcversion}-universal.jar`;
        }

        DownloadsManager.startFileDownload(
          `Minecraft Forge ${profile.frameworks.forge.version}\n_A_${profile.name}`,
          downloadURL,
          path.join(forgePath, `mcm-${profile.id}-forge.jar`)
        ).then(() => {
          resolve();
        });
      }
    }),
  uninstallForge: profile =>
    new Promise(resolve => {
      LibrariesManager.deleteLibrary(profile).then(() => {
        VersionsManager.deleteVersion(profile).then(() => {
          LauncherManager.setProfileData(
            profile,
            'lastVersionId',
            profile.version.minecraft.version
          );
          profile.removeFramework('forge');
          resolve();
        });
      });
    }),
  getForgePromotions: () =>
    new Promise(resolve => {
      HTTPRequest.httpGet(
        'https://files.minecraftforge.net/maven/net/minecraftforge/forge/promotions.json'
      ).then(promotions => {
        resolve(promotions);
      });
    }),
};

export default ForgeFramework;
