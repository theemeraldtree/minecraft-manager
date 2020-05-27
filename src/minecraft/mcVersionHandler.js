import path from 'path';
import { promises as fs } from 'fs';
import FSU from '../util/fsu';
import HTTPRequest from '../host/httprequest';
import FabricFramework from '../framework/fabric/fabricFramework';
import Global from '../util/global';

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

    const manifestVer = this.VERSION_MANIFEST.versions.find(ver => ver.id === mcVer);

    const final = (await HTTPRequest.get(manifestVer.url)).data;
    final._priority = 0;
    return final;
  }

  /**
   * Updates or creates a profile's JSON patches and compiles them
   * @param {object} profile - The profile to update
   */
  updateProfile = async (profile) => {
    const versionPath = path.join(profile.mcmPath, '/version/');
    FSU.createDirIfMissing(versionPath);

    await fs.writeFile(path.join(versionPath, '/default.json'), JSON.stringify(await this.getDefaultJSON(profile.minecraftVersion)));

    await this.getFrameworkPatches(profile);

    await this.saveCompiledVersionJSON(profile);

    await this.createLauncherIntegration(profile);
  }

  /**
   * Downloads and correctly formats the required patches from Frameworks
   * @param {object} profile - The profile to use
   */
  getFrameworkPatches = async (profile) => {
    const addPatch = async (name, data) => {
      await fs.writeFile(path.join(profile.mcmPath, `/version/${name}`), JSON.stringify(data));
    };

    if (profile.frameworks?.fabric) await addPatch('fabric.json', await FabricFramework.getVersionJSON(profile));
  }

  saveCompiledVersionJSON = async (profile) => {
    const compiled = await this.compileVersionJSON(profile);

    await fs.writeFile(path.join(profile.mcmPath, '/version.json'), JSON.stringify(compiled));
  }

  compileVersionJSON = async (profile) => {
    const versionPath = path.join(profile.mcmPath, '/version/');
    const defaultJSON = await FSU.readJSON(path.join(versionPath, 'default.json'));

    let patches = await Promise.all((await fs.readdir(versionPath)).filter(pn => pn !== 'default.json').map(async patchName => JSON.parse(await fs.readFile(path.join(versionPath, patchName)))));

    patches = patches.sort((a, b) => a._priority - b._priority);

    const final = { ...defaultJSON };

    patches.forEach((patch, index) => {
      let previousPatch;
      if (patches[index - 1]) {
        previousPatch = patches[index - 1];
      } else {
        previousPatch = {
          _priority: -Infinity
        };
      }

      Object.keys(patch).forEach(rawKey => {
        if (rawKey[0] === '+') {
          const key = rawKey.substring(1);
          if (final[key] && Array.isArray(final[key])) final[key] = [...final[key], ...patch[rawKey]];
        } else if (rawKey !== '_priority') {
          const key = rawKey;
          if ((final[key] && patch._priority >= previousPatch._priority) || (!final[key])) final[key] = patch[key];
        }
      });
    });

    final.id = profile.versionname;
    final._priority = undefined;

    return final;
  }

  createLauncherIntegration = async (profile) => {
    FSU.createDirIfMissing(path.join(this.getVersionsPath(), profile.versionname));

    const symlinkJSONPath = path.join(this.getVersionsPath(), `/${profile.versionname}/${profile.versionname}.json`);

    FSU.deleteFileIfExists(symlinkJSONPath);
    await fs.link(path.join(profile.mcmPath, '/version.json'), symlinkJSONPath);
  }
}

export default new MCVersionHandler();
