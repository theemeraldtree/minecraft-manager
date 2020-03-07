import fs from 'fs';
import path from 'path';
import ToastManager from '../manager/toastManager';
import HTTPRequest from './httprequest';
import Curse from './curse/curse';
import DownloadsManager from '../manager/downloadsManager';
import Mod from '../type/mod';
import Global from '../util/global';
import ProfilesManager from '../manager/profilesManager';
import GenericAsset from '../type/genericAsset';
import ForgeFramework from '../framework/forge/forgeFramework';
import FabricFramework from '../framework/fabric/fabricFramework';

const Hosts = {
  /* shared functions for hosts */
  cache: {
    popular: {
      curse: {},
    },
    assets: {},
  },

  concurrentDownloads: [],

  async sendCantConnect() {
    ToastManager.createToast(
      'Whoops!',
      "Looks like we can't connect to Curse right now. Check your internet connection and try again."
    );
  },

  async HTTPGet(url, qs, tries) {
    try {
      return await HTTPRequest.get(url, qs);
    } catch (err) {
      if (!tries) {
        return await this.HTTPGet(url, qs, 1);
      }
      if (tries !== 3) {
        return await this.HTTPGet(url, qs, tries + 1);
      }
      this.sendCantConnect();
      return undefined;
    }
  },

  /* functions for using hosts */
  async getTopAssets(host, assetType) {
    if (host === 'curse') {
      if (!this.cache.popular.curse[assetType]) {
        return await Curse.getPopularAssets(assetType);
      }

      return this.cache.popular.curse[assetType];
    }
  },

  async getDependencies(host, asset) {
    if (host === 'curse') {
      return await Curse.getDependencies(asset);
    }
  },

  async getVersions(host, asset) {
    if (host === 'curse') {
      if (this.cache.assets[asset.cachedID]) {
        const { versionCache } = this.cache.assets[asset.cachedID].hosts.curse;
        if (versionCache) return versionCache;
      }

      return await Curse.getVersions(asset);
    }
  },

  async checkForAssetUpdates(host, asset) {
    if (host === 'curse') {
      return await Curse.checkForAssetUpdates(asset);
    }
  },

  async getLatestVersionForMCVersion(host, asset, mcVersion, modloader) {
    if (host === 'curse') {
      return await Curse.getLatestVersionForMCVersion(
        asset,
        mcVersion,
        modloader
      );
    }
  },

  async getFileChangelog(host, asset, fileID) {
    if (host === 'curse') {
      return await Curse.getFileChangelog(asset, fileID);
    }
  },

  async searchAssets(host, assetType, searchTerm) {
    if (host === 'curse') {
      return await Curse.search(assetType, searchTerm);
    }
  },

  async addMissingInfo(host, info, asset) {
    if (host === 'curse') {
      return await Curse.addMissingInfo(info, asset);
    }
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
      const newAsset = await this.addMissingInfo(
        host,
        'description',
        cachedAsset
      );
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
        this.concurrentDownloads.push(item.cachedID);
        const mod = await this.installAssetVersionToProfile(
          host,
          profile,
          item,
          'unknown',
          false
        );
        this.cache.assets[item.cachedID] = mod;
        onUpdate();
        list.shift();
        this.downloadModList(host, profile, list, callback, onUpdate);
      }
    }
  },

  /* installers */
  async installAssetToProfile(host, profile, asset, type) {
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

    const ver = await this.getLatestVersionForMCVersion(
      host,
      asset,
      profile.version.minecraft.version,
      modloader
    );

    if (!ver) {
      return 'no-version-available';
    }

    let newMod;
    if (host === 'curse') {
      newMod = await Curse.addFileInfo(asset, ver.projectFileId);
    }

    return await this.installAssetVersionToProfile(
      host,
      profile,
      newMod,
      type,
      true
    );
  },

  async installDependencies(host, profile, asset, type) {
    if (asset.dependencies) {
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

  async installAssetVersionToProfile(host, profile, mod, type, dependencies) {
    return new Promise(async resolve => {
      let pathroot;
      let extension;
      if (type === 'mod') {
        pathroot = '/mods/';
        extension = 'jar';
      } else if (type === 'resourcepack') {
        pathroot = '/resourcepacks/';
        extension = 'zip';
      }
      if (
        !fs.existsSync(
          path.join(profile.gameDir, `${pathroot}${mod.id}.${extension}`)
        )
      ) {
        if (!mod.name || mod.icon.substring(0, 4) !== 'http') {
          if (host === 'curse') {
            const newm = await Curse.getFullAsset(mod, type);
            newm.hosts.curse.fileID = mod.hosts.curse.fileID;
            mod = newm;
          }
        }

        if (host === 'curse') {
          if (!mod.version || !mod.version.hosts.curse) {
            mod = await Curse.addFileInfo(mod, mod.hosts.curse.fileID);
          }

          if (profile.hasFramework()) {
            if (profile.frameworks.forge) {
              if (
                mod.version.hosts.curse.localValues.inferredModloader !==
                'forge'
              ) {
                resolve('no-version-available');
                return;
              }
            } else if (profile.frameworks.fabric) {
              if (
                mod.version.hosts.curse.localValues.inferredModloader !==
                'fabric'
              ) {
                resolve('no-version-available');
                return;
              }
            }
          } else {
            resolve('no-version-available');
            return;
          }
        }

        if (type === 'unknown') {
          type = mod.type;
        }

        DownloadsManager.createProgressiveDownload(`${mod.name}\n_A_`).then(
          async download => {
            if (dependencies) {
              this.installDependencies(host, profile, mod);
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
              modObj = new GenericAsset(mod);
            }

            DownloadsManager.startAssetDownload(
              profile,
              mod,
              type,
              mod.downloadTemp,
              false
            ).then(async () => {
              if (type === 'mod') {
                modObj.setJARFile(`${mod.id}.jar`);
                modObj.icon = `_mcm/icons/mods/${mod.id}${path.extname(
                  mod.iconPath
                )}`;
              } else if (type === 'resourcepack') {
                modObj.setMainFile(
                  'resourcepacks',
                  'resourcepackzip',
                  `${mod.id}.zip`
                );
                modObj.icon = `_mcm/icons/resourcepacks/${mod.id}${path.extname(
                  mod.iconPath
                )}`;
              }

              DownloadsManager.startFileDownload(
                `${mod.name} Icon\n_A_${profile.name}`,
                mod.iconPath,
                path.join(profile.profilePath, modObj.icon)
              );

              if (!profile.getSubAssetFromID(type, mod.id)) {
                profile.addSubAsset(type, modObj);
              }

              if (profile.progressState[mod.id]) {
                profile.progressState[mod.id] = {
                  progress: 'installed',
                  version: mod.version.displayName,
                };
              }

              resolve(mod);
            });
          }
        );
      } else {
        resolve(mod);
      }
    });
  },

  async installModpackVersion(host, modpack, version) {
    return new Promise(async resolve => {
      if (!fs.existsSync(Global.MCM_TEMP)) {
        fs.mkdirSync(Global.MCM_TEMP);
      }

      const versions = await this.getVersions(host, modpack);

      let verObj;
      let downloadUrl;
      const versionIsNumber = parseInt(version);
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

      ProfilesManager.createProfile(modpack.name, minecraftVersion).then(
        async profile => {
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
          profile.description = modpack.description;

          profile.version = verObj;
          profile.save();
          profile.changeMCVersion(minecraftVersion);
          if (host === 'curse') {
            profile.hosts.curse.fullyInstalled = false;
            profile.hosts.curse.fileID = verObj.id;
            profile.hosts.curse.fileName = version.fileName;

            const forgeVersion = Curse.getForgeVersionForModpackInstall(
              modpack
            );
            if (forgeVersion) {
              profile.setFrameworkVersion('forge', forgeVersion);
            }
          }

          profile.save();
          profile.state = 'installing';
          ProfilesManager.updateProfile(profile);
          DownloadsManager.createProgressiveDownload(
            `Mods\n_A_${modpack.name}`
          ).then(download => {
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
                      path.join(
                        profile.profilePath,
                        `/icon${path.extname(profile.iconURL)}`
                      )
                    ).then(async () => {
                      if (host === 'curse') {
                        await Curse.cleanupModpackInstall(profile);
                        profile.hosts.curse.fullyInstalled = true;
                      }

                      profile.save();
                      profile.addIconToLauncher();
                      ProfilesManager.progressState[profile.id] = {
                        progress: 'installed',
                        version: profile.version.displayName,
                      };
                      if (!modpack.cachedID) {
                        modpack.cachedID = `${host}-cached-${modpack.id}`;
                      }
                      this.cache.assets[modpack.cachedID] = profile;
                      ProfilesManager.profilesBeingInstalled.splice(
                        ProfilesManager.profilesBeingInstalled.indexOf(
                          modpack.id
                        ),
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
                DownloadsManager.setDownloadProgress(
                  download.name,
                  Math.ceil((numberDownloaded / mods.length) * 100)
                );
              },
              concurrent
            );
          });
        }
      );
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
        const newModpack = await Curse.addFileInfo(
          cachedAsset,
          modpack.hosts.curse.latestFileID
        );
        this.cache.assets[modpack.cachedID] = newModpack;
      }
    }

    const mp = cachedAsset;

    if (host === 'curse') {
      latestFileID = mp.hosts.curse.latestFileID;
    }

    await this.installModpackVersion(host, mp, latestFileID);
  },
};

export default Hosts;
