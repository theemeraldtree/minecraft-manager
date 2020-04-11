import fs from 'fs';
import path from 'path';
import VersionsManager from '../../manager/versionsManager';
import LibrariesManager from '../../manager/librariesManager';
import DownloadsManager from '../../manager/downloadsManager';
import ForgeComplex from './forgeComplex';
import LauncherManager from '../../manager/launcherManager';
import HTTPRequest from '../../host/httprequest';
import logInit from '../../util/logger';

const logger = logInit('ForgeFramework');

const ForgeFramework = {
  setupForge: profile =>
    new Promise(resolve => {
      if (VersionsManager.checkIs113OrHigher(profile)) {
        // we are version 1.13 or higher
        // we have to do the hard forge install process

        logger.info(`Forwarding Forge install of ${profile.id} to ForgeComplex`);
        ForgeComplex.setupForge(profile, resolve);
      } else {
        profile.setFrameworkIsInstalling('forge');
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
        } else if (mcversion === '1.8.9' || mcversion === '1.8.8' || mcversion === '1.8') {
          downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.frameworks.forge.version}-${mcversion}/forge-${profile.frameworks.forge.version}-${mcversion}-universal.jar`;
        }

        logger.info(`Starting download of Forge jar for ${profile.id}`);
        DownloadsManager.startFileDownload(
          `Minecraft Forge ${profile.frameworks.forge.version}\n_A_${profile.name}`,
          downloadURL,
          path.join(forgePath, `mcm-${profile.id}-forge.jar`)
        ).then(() => {
          logger.info(`Finished downloading Forge jar for ${profile.id}`);
          profile.unsetFrameworkIsInstalling('forge');
          resolve();
        });
      }
    }),
  uninstallForge: profile =>
    new Promise(resolve => {
      logger.info(`Starting removal of Forge from ${profile.id}`);
      LibrariesManager.deleteLibrary(profile).then(() => {
        VersionsManager.deleteVersion(profile).then(() => {
          LauncherManager.setProfileData(profile, 'lastVersionId', profile.version.minecraft.version);
          profile.removeFramework('forge');

          logger.info(`Finished removing Forge from ${profile.id}`);
          resolve();
        });
      });
    }),
  getForgePromotions: () =>
    new Promise(async resolve => {
      logger.info('Getting Forge promotions');
      resolve(
        (await HTTPRequest.get('https://files.minecraftforge.net/maven/net/minecraftforge/forge/promotions.json')).data
      );
    }),
  getForgeVersions: minecraftVersion =>
    new Promise(async resolve => {
      logger.info('Getting Forge versions');
      const metadata = await HTTPRequest.get(
        'https://files.minecraftforge.net/maven/net/minecraftforge/forge/maven-metadata.json'
      );
      resolve(metadata.data[minecraftVersion]);
    })
};

export default ForgeFramework;
