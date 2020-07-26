import path from 'path';
import AdmZip from 'adm-zip';
import fs from 'fs';
import semver from 'semver';
import VersionsManager from '../../manager/versionsManager';
import LibrariesManager from '../../manager/librariesManager';
import DownloadsManager from '../../manager/downloadsManager';
import ForgeComplex from './forgeComplex';
import HTTPRequest from '../../host/httprequest';
import logInit from '../../util/logger';
import Global from '../../util/global';
import MCVersionHandler from '../../minecraft/mcVersionHandler';
import FSU from '../../util/fsu';
import versionLibMappings from './versionLibMappings.json';
import Downloader from '../../util/downloader';

const logger = logInit('ForgeFramework');

const ForgeFramework = {
  versionJSONCache: {},
  setupForgeJarmodded(profile) {
    return new Promise((resolve, reject) => {
      // Pre-1.6 Forge needs to be jarmodded
      // That means no custom version JSON
      profile.setFrameworkIsInstalling('forge');

      logger.info(`Downloading universal for ${profile.id}`);
      const downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.frameworks.forge.version}/forge-${profile.frameworks.forge.version}-universal.zip`;

      const universalPath = path.join(profile.mcmPath, `/jarmods/_forge-${profile.frameworks.forge.version}.jar`);

      DownloadsManager.startFileDownload(
        `Minecraft Forge ${profile.frameworks.forge.version}\n_A_${profile.name}`,
        downloadURL,
        universalPath
      ).then(async () => {
        logger.info(`Finished downloading Universal Forge Jar for ${profile.id}`);
        profile.setFrameworkProperty('forge', 'jarmodFile', `_forge-${profile.frameworks.forge.version}.jar`);

        logger.info(`Downloading FMLLibs for ${profile.id}`);
        FSU.createDirIfMissing(path.join(profile.gameDir, '/lib'));

        let mappingName = profile.version.minecraft.version;

        switch (mappingName) {
          case '1.3.2':
            mappingName = '1.3.*';
            break;
          case '1.4':
          case '1.4.1':
          case '1.4.2':
          case '1.4.3':
          case '1.4.4':
          case '1.4.5':
          case '1.4.6':
          case '1.4.7':
            mappingName = '1.4.*';
            break;
          default:
            break;
        }

        const libs = versionLibMappings[mappingName];

        await Downloader.downloadConcurrently(libs.map(lib => ({
          url: !lib.forceURL ? `https://files.minecraftforge.net/fmllibs/${lib.name}` : lib.forceURL,
          dest: path.join(profile.gameDir, `/lib/${lib.name}`)
        })));

        profile.unsetFrameworkIsInstalling('forge');
        MCVersionHandler.updateProfile(profile);
        resolve();
      }).catch(async e => {
        await this.uninstallForge(profile);
        reject(e);
      });
    });
  },
  setupForge(profile) {
    if (VersionsManager.checkIs113OrHigher(profile)) {
      // we are version 1.13 or higher
      // we have to do the hard forge install process

      logger.info(`Forwarding Forge install of ${profile.id} to ForgeComplex`);
      return ForgeComplex.setupForge(profile);
    }

    if (semver.lt(profile.version.minecraft.version, '1.6.1')) {
      // Pre-1.6, we need to jarmod

      logger.info(`Forwarding Forge install of ${profile.id} to SetupForgeJarmodded`);
      return this.setupForgeJarmodded(profile);
    }

    return new Promise((resolve, reject) => {
      profile.setFrameworkIsInstalling('forge');

      const profileLibraryPath = path.join(LibrariesManager.getMCMLibraries(), `/mcm-${profile.id}/forge/`);
      FSU.createDirIfMissing(profileLibraryPath);

      const profileJarPath = path.join(profileLibraryPath, `/mcm-${profile.id}-forge.jar`);

      const forgePath = path.join(LibrariesManager.getLibrariesPath(), '/minecraftmanager/forge/');
      FSU.createDirIfMissing(forgePath);

      const forgeJarPath = path.join(forgePath, `/forge-${profile.frameworks.forge.version}.jar`);

      const mcversion = profile.version.minecraft.version;
      let downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.frameworks.forge.version}/forge-${profile.frameworks.forge.version}-installer.jar`;
      if (mcversion === '1.7.10') {
        downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.frameworks.forge.version}-1.7.10/forge-${profile.frameworks.forge.version}-1.7.10-installer.jar`;
      } else if (mcversion === '1.8.9') {
        downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.frameworks.forge.version}-${mcversion}/forge-${profile.frameworks.forge.version}-${mcversion}-installer.jar`;
      }

      const tempJarPath = path.join(Global.MCM_TEMP, `/${profile.id}-forgeinstaller.jar`);

      logger.info(`Starting download of Forge jar for ${profile.id}`);
      DownloadsManager.startFileDownload(
        `Minecraft Forge ${profile.frameworks.forge.version}\n_A_${profile.name}`,
        downloadURL,
        tempJarPath,
      ).then(() => {
        logger.info(`Finished downloading Forge installer jar for ${profile.id}`);
        logger.info('Extracting Universal');


        const zip = new AdmZip(tempJarPath);

        const mavenUniversalPath = `maven/net/minecraftforge/forge/${profile.frameworks.forge.version}/forge-${profile.frameworks.forge.version}.jar`;
        let rootUniversalPath = `forge-${profile.frameworks.forge.version}-universal.jar`;

        if (
          mcversion === '1.7.10' ||
          mcversion === '1.8.9'
        ) {
          rootUniversalPath = `forge-${profile.frameworks.forge.version}-${mcversion}-universal.jar`;
        }

        if (
          semver.lt(mcversion, '1.7.2')
        ) {
          rootUniversalPath = `minecraftforge-universal-${profile.frameworks.forge.version}.jar`;
        }

        const entryNames = zip.getEntries().map(entry => entry.name);


        if (entryNames.includes(mavenUniversalPath)) {
          zip.extractEntryTo(mavenUniversalPath, forgePath, false, true);
        } else if (entryNames.includes(rootUniversalPath)) {
          zip.extractEntryTo(rootUniversalPath, forgePath, false, true);
          fs.renameSync(path.join(forgePath, rootUniversalPath), forgeJarPath);
        }

        logger.info('Exctracting Version JSON');
        const versionJSON = this.extractVersionJSON(zip);
        this.versionJSONCache[profile.frameworks.forge.version] = versionJSON;

        FSU.updateSymlink(profileJarPath, forgeJarPath);


        MCVersionHandler.updateProfile(profile);

        profile.unsetFrameworkIsInstalling('forge');

        resolve();
      }).catch(async e => {
        await this.uninstallForge(profile);
        reject(e);
      });
    });
  },
  uninstallForge: profile =>
    new Promise(resolve => {
      logger.info(`Starting removal of Forge from ${profile.id}`);
      LibrariesManager.deleteLibrary(profile).then(() => {
        VersionsManager.deleteVersion(profile).then(() => {
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
    }),
  applyVersionJSONPatches(profile, rawJSON) {
    const json = { ...rawJSON };
    json['+libraries'][0] = {
      name: `minecraftmanager.profiles:mcm-${profile.id}:forge`
    };

    // This code has been commented out because I have not found it to have a use anymore
    // it was put in to include the Forge client and Universal jars on the classpath,
    // however that caused problems with modpacks using Jumploader.
    // Removing the Client and Universal from the classpath appears to have no effect.

    // if (VersionsManager.checkIs113OrHigher(profile)) {
      // json['+libraries'].push({
      //   name: `net.minecraftforge:forge:${profile.frameworks.forge.version}:client`,
      //   _disableDownload: true
      // });
      // json['+libraries'].push({
      //   name: `net.minecraftforge:forge:${profile.frameworks.forge.version}:universal`,
      //   _disableDownload: true
      // });
    // }

    return json;
  },
  extractVersionJSON(zip) {
    let json = JSON.parse(zip.readFile('version.json'));

    if (!json) json = JSON.parse(zip.readFile('install_profile.json')).versionInfo;

    json['+libraries'] = json.libraries;
    json.libraries = undefined;
    json._comment_ = undefined;
    json._priority = 1;
    json.inheritsFrom = undefined;
    json.id = undefined;
    json.time = undefined;

    if (json.arguments && json.arguments.game) {
      json.arguments = {
        '+game': json.arguments.game
      };
    }

    return json;
  },
  getVersionJSON(profile) {
    return new Promise(async (resolve, reject) => {
      if (this.versionJSONCache[profile.frameworks.forge.version]) {
        resolve(this.applyVersionJSONPatches(profile, this.versionJSONCache[profile.frameworks.forge.version]));
      } else {
        const installerPath = path.join(Global.MCM_TEMP, `/forge-installer-${new Date().getTime()}`);
        let url;
        switch (profile.version.minecraft.version) {
          case '1.7.10':
            url = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.frameworks.forge.version}-1.7.10/forge-${profile.frameworks.forge.version}-1.7.10-installer.jar`;
            break;
          default:
            url = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.frameworks.forge.version}/forge-${profile.frameworks.forge.version}-installer.jar`;
            break;
        }

        try {
          await DownloadsManager.startFileDownload(
            'Minecraft Forge Installer',
            url,
            installerPath
          );
        } catch (e) {
          reject(e);
        }

        const json = this.applyVersionJSONPatches(profile, this.extractVersionJSON(new AdmZip(installerPath)));

        resolve(json);
      }
    });
  }
};

export default ForgeFramework;
