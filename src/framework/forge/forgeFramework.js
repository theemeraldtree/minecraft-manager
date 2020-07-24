import path from 'path';
import AdmZip from 'adm-zip';
import fs from 'fs';
import VersionsManager from '../../manager/versionsManager';
import LibrariesManager from '../../manager/librariesManager';
import DownloadsManager from '../../manager/downloadsManager';
import ForgeComplex from './forgeComplex';
import HTTPRequest from '../../host/httprequest';
import logInit from '../../util/logger';
import Global from '../../util/global';
import MCVersionHandler from '../../minecraft/mcVersionHandler';
import FSU from '../../util/fsu';

const logger = logInit('ForgeFramework');

const ForgeFramework = {
  versionJSONCache: {},
  setupForge(profile) {
    if (VersionsManager.checkIs113OrHigher(profile)) {
      // we are version 1.13 or higher
      // we have to do the hard forge install process

      logger.info(`Forwarding Forge install of ${profile.id} to ForgeComplex`);
      return ForgeComplex.setupForge(profile);
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

    if (VersionsManager.checkIs113OrHigher(profile)) {
      json['+libraries'].push({
        name: `net.minecraftforge:forge:${profile.frameworks.forge.version}:client`,
        _disableDownload: true
      });
      json['+libraries'].push({
        name: `net.minecraftforge:forge:${profile.frameworks.forge.version}:universal`,
        _disableDownload: true
      });
    }

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
