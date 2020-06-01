import path from 'path';
import { promises as fs } from 'fs';
import FSU from '../util/fsu';
import HTTPRequest from '../host/httprequest';
import FabricFramework from '../framework/fabric/fabricFramework';
import Global from '../util/global';
import ForgeFramework from '../framework/forge/forgeFramework';
import SettingsManager from '../manager/settingsManager';

/**
 * Handles creation of Minecraft Version JSON Files and patches
 */
class MCVersionHandler {
  getVersionsPath = () => path.join(Global.getMCPath(), '/versions')

  /**
   * Downloads and sets VERSION_MANIFEST to the latest Version Manifest
   */
  getVersionManifest = async () => new Promise(async resolve => {
    this.VERSION_MANIFEST = (await HTTPRequest.get('https://launchermeta.mojang.com/mc/game/version_manifest.json')).data;
    resolve();
    })

  /**
   * Gets the default Version JSON for the specified Minecraft Version
   * @param {string} mcVer - The Minecraft Version
   */
  getDefaultJSON = async (mcVer) => {
    if (!this.VERSION_MANIFEST) await this.getVersionManifest();

    console.log(mcVer);
    console.log(this.VERSION_MANIFEST);
    const manifestVer = this.VERSION_MANIFEST.versions.find(ver => ver.id === mcVer);

    const final = (await HTTPRequest.get(manifestVer.url)).data;
    final._priority = 0;
    return final;
  }

  /**
   * Updates or creates a profile's JSON patches and compiles them
   * @param {object} profile - The profile to update
   */
  updateProfile = (profile, redownload = true) => new Promise(async resolve => {
      const versionPath = path.join(profile.mcmPath, '/version/');
      FSU.createDirIfMissing(versionPath);

      await fs.writeFile(path.join(versionPath, '/default.json'), JSON.stringify(await this.getDefaultJSON(profile.minecraftVersion)));

      if (redownload) await this.getFrameworkPatches(profile);

      await this.saveCompiledVersionJSON(profile);

      await this.createLauncherIntegration(profile);

      resolve();
    })

  /**
   * Downloads and correctly formats the required patches from Frameworks
   * @param {object} profile - The profile to use
   */
  getFrameworkPatches = async (profile) => {
    const addPatch = async (name, data) => {
      await fs.writeFile(path.join(profile.mcmPath, `/version/${name}`), JSON.stringify(data));
    };

    if (profile.frameworks.fabric) await addPatch('fabric.json', await FabricFramework.getVersionJSON(profile));
    if (profile.frameworks.forge) await addPatch('forge.json', await ForgeFramework.getVersionJSON(profile));
  }

  saveCompiledVersionJSON = async (profile) => {
    const compiled = await this.compileVersionJSON(profile);

    await fs.writeFile(path.join(profile.mcmPath, '/version.json'), JSON.stringify(compiled));
  }

  compileVersionJSON = async (profile) => {
    const versionPath = path.join(profile.mcmPath, '/version/');
    const defaultJSON = await FSU.readJSON(path.join(versionPath, 'default.json'));

    let patches = await Promise.all((await fs.readdir(versionPath)).map(async patchName => JSON.parse(await fs.readFile(path.join(versionPath, patchName)))));

    patches = patches.sort((a, b) => a._priority - b._priority);

    let final = { ...defaultJSON };

    const compileObject = (first, second) => {
      const out = { ...first };

      Object.keys(second).forEach(rawKey => {
        console.log(rawKey, typeof (second[rawKey]));
        if (rawKey[0] === '+') {
          const key = rawKey.substring(1);
          if (out[key]) {
            out[key] = [...second[rawKey], ...out[key]];
          } else {
            out[key] = second[key];
          }
        } else if (typeof (second[rawKey]) === 'object' && !Array.isArray(second[rawKey])) {
          let newFirst = out[rawKey];
          if (!newFirst) newFirst = {};

          out[rawKey] = compileObject(newFirst, second[rawKey]);
        } else if (rawKey !== '_priority') {
          if ((out[rawKey] && second._priority >= first._priority) || !out[rawKey]) {
            console.log(rawKey, second[rawKey]);
            out[rawKey] = second[rawKey];
          }
        }
      });

      return out;
    };

    patches.forEach((patch, index) => {
      let previousPatch;
      if (patches[index - 1]) {
        previousPatch = patches[index - 1];
      } else {
        previousPatch = {
          _priority: -Infinity
        };
      }

      final = compileObject(previousPatch, patch);
    });

    final.id = profile.versionname;
    final.type = undefined;
    final._priority = undefined;

    return final;
  }

  createLauncherIntegration = async (profile) => {
    if (SettingsManager.currentSettings.launcherIntegration) {
      FSU.createDirIfMissing(path.join(this.getVersionsPath(), profile.versionname));

      const symlinkJSONPath = path.join(this.getVersionsPath(), `/${profile.versionname}/${profile.versionname}.json`);

      FSU.deleteFileIfExists(symlinkJSONPath);
      await fs.link(path.join(profile.mcmPath, '/version.json'), symlinkJSONPath);
    }
  }
}

export default new MCVersionHandler();
