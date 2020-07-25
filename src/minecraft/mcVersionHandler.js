import path from 'path';
import semver from 'semver';
import fss, { promises as fs } from 'fs';
import rimraf from 'rimraf';
import FSU from '../util/fsu';
import HTTPRequest from '../host/httprequest';
import FabricFramework from '../framework/fabric/fabricFramework';
import Global from '../util/global';
import ForgeFramework from '../framework/forge/forgeFramework';
import SettingsManager from '../manager/settingsManager';

/**
 * Handles creation of Minecraft Version JSON Files and patches
 */
const MCVersionHandler = {
  getVersionsPath() {
    return path.join(Global.getMCPath(), '/versions');
  },

  /**
   * Downloads and sets VERSION_MANIFEST to the latest Version Manifest
   */
  async getVersionManifest() {
    return new Promise(async (resolve, reject) => {
      try {
        this.VERSION_MANIFEST = (await HTTPRequest.get('https://launchermeta.mojang.com/mc/game/version_manifest.json')).data;


      resolve();
      } catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Gets the default Version JSON for the specified Minecraft Version
   * @param {string} mcVer - The Minecraft Version
   */
  getDefaultJSON(mcVer) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.VERSION_MANIFEST) await this.getVersionManifest();


        const manifestVer = this.VERSION_MANIFEST.versions.find(ver => ver.id === mcVer);

        const final = (await HTTPRequest.get(manifestVer.url)).data;
        final._priority = 0;
        resolve(final);
      } catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Updates or creates a profile's JSON patches and compiles them
   * @param {object} profile - The profile to update
   */
  async updateProfile(profile, redownload = true) {
    return new Promise(async (resolve, reject) => {
      const versionPath = path.join(profile.mcmPath, '/version/');
      FSU.createDirIfMissing(versionPath);

      if (!fss.existsSync(path.join(versionPath, '/default.json')) || redownload || (profile.id === '0-default-profile-latest' || profile.id === '0-default-profile-snapshot')) {
        try {
          await fs.writeFile(path.join(versionPath, '/default.json'), JSON.stringify(await this.getDefaultJSON(profile.minecraftVersion)));
        } catch (e) {
          if (!fss.existsSync(path.join(versionPath, '/default.json'))) {
            reject(new Error('no-version-json'));
            return;
          }
        }
      }

      if (redownload) await this.getFrameworkPatches(profile);

      await this.saveCompiledVersionJSON(profile);

      await this.createLauncherIntegration(profile);

      resolve();
    });
  },

  /**
   * Downloads and correctly formats the required patches from Frameworks
   * @param {object} profile - The profile to use
   */
  async getFrameworkPatches(profile) {
    const addPatch = async (name, data) => {
      await fs.writeFile(path.join(profile.mcmPath, `/version/${name}`), JSON.stringify(data));
    };

    if (profile.frameworks.fabric) await addPatch('fabric.json', await FabricFramework.getVersionJSON(profile));
    if (profile.frameworks.forge && !semver.lt(profile.version.minecraft.version, '1.6.0')) await addPatch('forge.json', await ForgeFramework.getVersionJSON(profile));
  },

  async saveCompiledVersionJSON(profile) {
    const compiled = await this.compileVersionJSON(profile);

    await fs.writeFile(path.join(profile.mcmPath, '/version.json'), JSON.stringify(compiled));
  },

  async compileVersionJSON(profile) {
    const versionPath = path.join(profile.mcmPath, '/version/');
    const defaultJSON = await FSU.readJSON(path.join(versionPath, 'default.json'));

    let patches = await Promise.all((await fs.readdir(versionPath)).map(async patchName => JSON.parse(await fs.readFile(path.join(versionPath, patchName)))));

    patches = patches.sort((a, b) => a._priority - b._priority).map(rawPatch => {
      // Forge for 1.6 has dupliacted libraries (org.lwjgl.lwjgl:jwjgl-platform:2.9.0) for some reason,
      // so they need to be de-duped here
      if (rawPatch['+libraries']) {
        const newPatch = { ...rawPatch };
        const defaultLibs = defaultJSON.libraries.map(lib => lib.name);
        const libs = rawPatch['+libraries'].filter(lib => !defaultLibs.includes(lib.name));
        newPatch['+libraries'] = libs;

        return newPatch;
      }

      return rawPatch;
    });

    let final = { ...defaultJSON };

    const compileObject = (first, second) => {
      const out = { ...first };

      Object.keys(second).forEach(rawKey => {
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
    final._priority = undefined;

    return final;
  },

  async createLauncherIntegration(profile) {
    if (SettingsManager.currentSettings.launcherIntegration) {
      FSU.createDirIfMissing(path.join(this.getVersionsPath(), profile.versionname));

      const symlinkJSONPath = path.join(this.getVersionsPath(), `/${profile.versionname}/${profile.versionname}.json`);

      FSU.deleteFileIfExists(symlinkJSONPath);
      await fs.link(path.join(profile.mcmPath, '/version.json'), symlinkJSONPath);
    }
  },

  deleteLauncherIntegration(profile) {
    if (fss.existsSync(path.join(this.getVersionsPath(), profile.versionname))) {
      rimraf.sync(path.join(this.getVersionsPath(), profile.versionname));
    }
  }
};

export default MCVersionHandler;
