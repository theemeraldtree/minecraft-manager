import fs from 'fs';
import path from 'path';
import ToastManager from '../manager/toastManager';
import HTTPRequest from './httprequest';
import Curse from './curse/curse';
import DownloadsManager from '../manager/downloadsManager';
import Mod from '../type/mod';
import Global from '../util/global';
import ProfilesManager from '../manager/profilesManager';
import OMAFFileAsset from '../type/omafFileAsset';
import ForgeFramework from '../framework/forge/forgeFramework';
import FabricFramework from '../framework/fabric/fabricFramework';
import World from '../type/world';
import logInit from '../util/logger';

const logger = logInit('Hosts');

const Hosts = {
  /* shared functions for hosts */
  cache: {
    popular: {
      curse: {}
    },
    assets: {}
  },

  concurrentDownloads: [],

  async sendCantConnect() {
    logger.error('Unable to connect to Curse');
    ToastManager.createToast(
      'Whoops!',
      "Looks like we can't connect to Curse right now. Check your internet connection and try again."
    );
  },

  async HTTPGet(url, qs, tries) {
    try {
      const res = (await HTTPRequest.get(url, qs)).data;
      return res;
    } catch (err) {
      if (!tries) {
        // eslint-disable-next-line no-return-await
        return await this.HTTPGet(url, qs, 1).data;
      }
      if (tries !== 3) {
        // eslint-disable-next-line no-return-await
        return await this.HTTPGet(url, qs, tries + 1).data;
      }
      this.sendCantConnect();
      return undefined;
    }
  },

  /* functions for using hosts */
  async getTopAssets(host, assetType, options = { sort: 'popular', minecraftVersion: 'All' }) {
    logger.info(`Getting Top Assets of type ${assetType} in host ${host} and options ${JSON.stringify(options)}`);
    if (host === 'curse') {
      if (
        !this.cache.popular.curse[assetType] ||
        (this.cache.popular.curse && this.cache.popular.curse.options !== options)
      ) {
        return Curse.getPopularAssets(assetType, options);
      }

      return this.cache.popular.curse[assetType];
    }

    return undefined;
  },

  async getDependencies(host, asset) {
    logger.info(`Getting dependencies for ${asset.id} and host ${host}`);
    if (host === 'curse') {
      const cachedAsset = this.cache.assets[asset.cachedID];
      if (cachedAsset && cachedAsset.dependencies) {
        return Promise.all(cachedAsset.dependencies.map(async depend => Curse.getFullAsset(depend, 'unknown')));
      }

      return Curse.getDependencies(asset);
    }

    return undefined;
  },

  async getVersions(host, asset) {
    logger.info(`Getting versions for ${asset.id} and host ${host}`);
    if (host === 'curse') {
      if (this.cache.assets[asset.cachedID]) {
        const { versionCache } = this.cache.assets[asset.cachedID].hosts.curse;
        if (versionCache) return versionCache;
      }

      return Curse.getVersions(asset);
    }

    return undefined;
  },

  async checkForAssetUpdates(host, asset) {
    if (host === 'curse') {
      return Curse.checkForAssetUpdates(asset);
    }

    return undefined;
  },

  async getLatestVersionForMCVersion(host, asset, mcVersion, modloader) {
    if (host === 'curse') {
      return Curse.getLatestVersionForMCVersion(asset, mcVersion, modloader);
    }

    return undefined;
  },

  async getClosestOlderVersion(host, asset, mcVersion) {
    if (host === 'curse') {
      return Curse.getClosestOlderVersion(asset, mcVersion);
    }

    return undefined;
  },

  async getFileChangelog(host, asset, fileID) {
    if (host === 'curse') {
      return Curse.getFileChangelog(asset, fileID);
    }

    return undefined;
  },

  async searchAssets(host, assetType, searchTerm, sort = 'popular', filter) {
    if (host === 'curse') {
      return Curse.search(assetType, searchTerm, sort, filter);
    }

    return undefined;
  },

  async addMissingInfo(host, info, asset) {
    if (host === 'curse') {
      return Curse.addMissingInfo(info, asset);
    }

    return undefined;
  },

  async cacheAllAssetInfo(host, asset) {
    if (!this.cache.assets[asset.cachedID]) {
      this.cache.assets[asset.cachedID] = asset;
    }

    const cachedAsset = this.cache.assets[asset.cachedID];

    if (cachedAsset !== asset) {
      this.cache.assets[asset.cachedID] = asset;
    }

    if (!cachedAsset.description) {
      const newAsset = await this.addMissingInfo(host, 'description', cachedAsset);
      this.cache.assets[asset.cachedID] = newAsset;
    }
  },

  async downloadModList(host, profile, list, callback, onUpdate, concurrent) {
    if (concurrent !== 0 && concurrent !== undefined) {
      for (let i = 0; i < concurrent - 1; i++) {
        this.downloadModList(host, profile, list, callback, onUpdate);
      }
    }

    if (list.length === 0) {
      callback();
    } else {
      const item = { ...list[0] };
      if (this.concurrentDownloads.includes(item.cachedID)) {
        const list2 = list.slice();
        list2.shift();
        this.downloadModList(host, profile, list2, callback, onUpdate);
      } else {
        try {
          this.concurrentDownloads.push(item.cachedID);
          const mod = await this.installAssetVersionToProfile(host, profile, item, 'unknown', false);
          this.cache.assets[item.cachedID] = mod;
          onUpdate();
          list.shift();
          this.downloadModList(host, profile, list, callback, onUpdate);
        } catch (e) {
          ToastManager.createToast('Skipped', 'An asset was unable to install.');
          onUpdate();
          list.shift();
          this.downloadModList(host, profile, list, callback, onUpdate);
        }
      }
    }
  },

  /* installers */
  async installAssetToProfile(host, profile, assetT, type) {
    let asset = assetT;
    logger.info(`Installing latest compatible version of ${asset.id} to ${profile.id} and host ${host}`);

    if (!asset.name) {
      if (host === 'curse') {
        asset = await Curse.getFullAsset(asset, type);
      }
    }

    let modloader;
    if (profile.frameworks.forge) {
      modloader = 'forge';
    } else if (profile.frameworks.fabric) {
      modloader = 'fabric';
    }

    let ver;
    const latestForMCVer = await this.getLatestVersionForMCVersion(
      host,
      asset,
      profile.version.minecraft.version,
      modloader
    );

    if (type === 'mod') {
      if (!latestForMCVer) {
        return 'no-version-available';
      }

      ver = latestForMCVer;
    } else if (!latestForMCVer) {
      ver = await this.getLatestVersionForMCVersion(
        host,
        asset,
        await this.getClosestOlderVersion(host, asset, profile.version.minecraft.version),
        modloader
      );

      if (!ver) return 'no-version-available';

      ToastManager.createToast(
        'Heads up',
        `A ${profile.version.minecraft.version}-compatible version of ${asset.name} wasn't found, but we're compensating by getting an older version. There may be bugs.`
      );
    } else {
      ver = latestForMCVer;
    }

    let newMod;
    if (host === 'curse') {
      newMod = await Curse.addFileInfo(asset, ver.projectFileId);
    }

    return this.installAssetVersionToProfile(host, profile, newMod, type, true);
  },

  async installDependencies(host, profile, asset, type) {
    if (asset.dependencies) {
      // eslint-disable-next-line no-restricted-syntax
      for (const depend of asset.dependencies) {
        if (depend) {
          if (depend.hosts.curse && depend.hosts.curse.fileID) {
            this.installAssetVersionToProfile(host, profile, depend, type);
          } else {
            this.installAssetToProfile(host, profile, depend, type);
          }
        }
      }
    }
  },

  async installAssetVersionToProfile(host, profileT, modT, typeT, dependencies) {
    return new Promise(async (resolve, reject) => {
      let mod = modT;

      logger.info(`Installing ${mod.id} assigned version to ${profileT.id} with host ${host}`);
      let type = typeT;
      const profile = profileT;
      let pathroot;
      let extension;
      if (type === 'mod') {
        pathroot = '/mods/';
        extension = 'jar';
      } else if (type === 'resourcepack') {
        pathroot = '/resourcepacks/';
        extension = 'zip';
      }
      if (!fs.existsSync(path.join(profile.gameDir, `${pathroot}${mod.id}.${extension}`))) {
        if (!mod.name || mod.icon.substring(0, 4) !== 'http') {
          if (host === 'curse') {
            const newm = await Curse.getFullAsset(mod, type);
            if (newm) {
              newm.hosts.curse.fileID = mod.hosts.curse.fileID;
              mod = newm;
            } else {
              reject();
              return;
            }
          }
        }

        if (host === 'curse') {
          if (!mod.version || !mod.version.hosts.curse) {
            mod = await Curse.addFileInfo(mod, mod.hosts.curse.fileID);
          }

          if (type === 'mod') {
            if (profile.hasFramework()) {
              if (profile.frameworks.forge) {
                if (mod.version.hosts.curse.localValues.inferredModloader !== 'forge') {
                  resolve('no-version-available');
                  return;
                }
              } else if (profile.frameworks.fabric) {
                if (mod.version.hosts.curse.localValues.inferredModloader !== 'fabric') {
                  resolve('no-version-available');
                  return;
                }
              }
            } else {
              resolve('no-version-available');
              return;
            }
          }
        }

        if (type === 'unknown') {
          type = mod.type;
        }

        DownloadsManager.createProgressiveDownload(`${mod.name}\n_A_`).then(async download => {
          if (dependencies) {
            this.installDependencies(host, profile, mod, type);
          }

          DownloadsManager.removeDownload(download.name);
          if (!mod.downloadTemp) {
            if (host === 'curse') {
              mod = await Curse.addFileInfo(mod, mod.hosts.curse.fileID);
            }
          }

          let modObj;
          if (type === 'mod') {
            modObj = new Mod(mod);
          } else if (type === 'resourcepack') {
            modObj = new OMAFFileAsset(mod);
          } else if (type === 'world') {
            modObj = new World(mod);
          }

          DownloadsManager.startAssetDownload(profile, mod, type, mod.downloadTemp, false)
            .then(async () => {
              if (type === 'mod') {
                modObj.setJARFile(`${mod.id}.jar`);
                if (modObj.iconPath) {
                  modObj.icon = `_mcm/icons/mods/${mod.id}${path.extname(mod.iconPath)}`;
                }
              } else if (type === 'resourcepack') {
                modObj.setMainFile('resourcepacks', 'resourcepackzip', `${mod.id}.zip`);
                if (modObj.iconPath) {
                  modObj.icon = `_mcm/icons/resourcepacks/${mod.id}${path.extname(mod.iconPath)}`;
                }
              } else if (type === 'world') {
                modObj.setMainFile('saves', 'worldfolder', mod.id);
                if (modObj.iconPath) {
                  modObj.icon = `_mcm/icons/worlds/${mod.id}${path.extname(mod.iconPath)}`;
                }
              }

              if (mod.iconPath) {
                DownloadsManager.startFileDownload(
                  `${mod.name} Icon\n_A_${profile.name}`,
                  mod.iconPath,
                  path.join(profile.profilePath, modObj.icon)
                );
              }

              if (!profile.getSubAssetFromID(type, mod.id)) {
                profile.addSubAsset(type, modObj);
              }

              if (profile.progressState[mod.id]) {
                profile.progressState[mod.id] = {
                  progress: 'installed',
                  version: mod.version.displayName
                };
              }

              resolve(mod);
            })
            .catch(() => {
              reject();
            });
        });
      } else {
        profile.progressState[mod.id] = {
          progress: 'installed',
          version: mod.version.displayName
        };
        resolve(mod);
      }
    });
  },

  async installModpackVersion(host, modpackT, version) {
    return new Promise(async resolve => {
      let modpack = modpackT;
      if (!fs.existsSync(Global.MCM_TEMP)) {
        fs.mkdirSync(Global.MCM_TEMP);
      }

      const versions = await this.getVersions(host, modpack);

      let verObj;
      let downloadUrl;
      const versionIsNumber = parseInt(version);
      // eslint-disable-next-line no-restricted-syntax
      for (const ver of versions) {
        if (
          (versionIsNumber && ver.hosts.curse.fileID === parseInt(version)) ||
          (!versionIsNumber && ver.displayName === version)
        ) {
          verObj = ver;
          downloadUrl = ver.TEMP.downloadUrl;
        }
      }

      await this.cacheAllAssetInfo(host, modpack);

      let mods = [];

      if (host === 'curse') {
        mods = await Curse.downloadModsListFromModpack(modpack, downloadUrl);
      }

      let minecraftVersion;
      if (host === 'curse') {
        minecraftVersion = Curse.getMinecraftVersionFromModpackInstall(modpack);
      }

      ProfilesManager.createProfile(modpack.name, minecraftVersion).then(async profileT => {
        const profile = profileT;
        if (!modpack.iconURL) {
          if (host === 'curse') {
            modpack = await Curse.getFullAsset(modpack);
          }
        }
        profile.hosts = modpack.hosts;

        profile.temp = {};
        profile.iconURL = modpack.iconURL;
        profile.iconPath = modpack.iconPath;
        profile.blurb = modpack.blurb;
        profile.description = modpack.description ? modpack.description : 'No description available.';

        profile.version = verObj;
        profile.save();
        profile.changeMCVersion(minecraftVersion);
        if (host === 'curse') {
          profile.hosts.curse.fullyInstalled = false;
          profile.hosts.curse.fileID = verObj.id;
          profile.hosts.curse.fileName = version.fileName;

          const forgeVersion = Curse.getForgeVersionForModpackInstall(modpack);
          if (forgeVersion) {
            profile.setFrameworkVersion('forge', forgeVersion);
          }
        }

        profile.save();
        profile.state = 'installing';
        ProfilesManager.updateProfile(profile);
        DownloadsManager.createProgressiveDownload(`Mods\n_A_${modpack.name}`).then(download => {
          let numberDownloaded = 0;
          const concurrent = mods.length >= 10 ? 10 : 0;
          this.downloadModList(
            host,
            profile,
            mods.slice(),
            async () => {
              if (numberDownloaded === mods.length) {
                DownloadsManager.removeDownload(download.name);
                this.concurrentDownloads = [];

                if (host === 'curse') {
                  await Curse.copyModpackOverrides(profile);
                }

                const final = () => {
                  DownloadsManager.startFileDownload(
                    `Icon\n_A_${profile.name}`,
                    profile.iconURL,
                    path.join(profile.profilePath, `/icon${path.extname(profile.iconURL)}`)
                  ).then(async () => {
                    if (host === 'curse') {
                      await Curse.cleanupModpackInstall(profile);
                      profile.hosts.curse.fullyInstalled = true;
                    }

                    profile.save();
                    profile.addIconToLauncher();
                    ProfilesManager.progressState[profile.id] = {
                      progress: 'installed',
                      version: profile.version.displayName
                    };
                    if (!modpack.cachedID) {
                      modpack.cachedID = `${host}-cached-${modpack.id}`;
                    }
                    this.cache.assets[modpack.cachedID] = profile;
                    ProfilesManager.profilesBeingInstalled.splice(
                      ProfilesManager.profilesBeingInstalled.indexOf(modpack.id),
                      1
                    );
                    resolve(profile);
                  });
                };
                if (profile.frameworks.forge) {
                  ForgeFramework.setupForge(profile).then(final);
                } else if (profile.frameworks.fabric) {
                  FabricFramework.setupFabric(profile).then(final);
                } else {
                  final();
                }
              }
            },
            () => {
              numberDownloaded++;
              DownloadsManager.setDownloadProgress(download.name, Math.ceil((numberDownloaded / mods.length) * 100));
            },
            concurrent
          );
        });
      });
    });
  },

  async installModpack(host, modpack) {
    if (!fs.existsSync(Global.MCM_TEMP)) {
      fs.mkdirSync(Global.MCM_TEMP);
    }

    const cachedAsset = this.cache.assets[modpack.cachedID];
    let latestFileID;

    if (cachedAsset.hosts.curse) {
      if (!cachedAsset.hosts.curse.fileID) {
        const newModpack = await Curse.addFileInfo(cachedAsset, modpack.hosts.curse.latestFileID);
        this.cache.assets[modpack.cachedID] = newModpack;
      }
    }

    const mp = cachedAsset;

    if (host === 'curse') {
      latestFileID = mp.hosts.curse.latestFileID;
    }

    await this.installModpackVersion(host, mp, latestFileID);
  }
};

export default Hosts;
