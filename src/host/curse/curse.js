import fuzzysort from 'fuzzysort';
import Global from '../../util/global';
import Profile from '../../type/profile';
import Mod from '../../type/mod';
import Hosts from '../Hosts';
import OMAFFileAsset from '../../type/omafFileAsset';
import World from '../../type/world';
import logInit from '../../util/logger';

const logger = logInit('CurseHost');

// the curse object is used as a sort of "translator" to convert curse's data format to work with OMAF
const Curse = {
  URL_BASE: 'https://addons-ecs.forgesvc.net/api/v2/addon',

  // main function to convert curse to omaf
  convertToOMAF(asset) {
    if (asset) {
      const id = Global.createID(asset.name);
      const obj = {
        omafVersion: Global.OMAF_VERSION,
        name: asset.name,
        id,
        blurb: asset.summary,
        authors: asset.authors.map(author => ({ name: author.name })),
        cachedID: `curse-cached-${id}`,
        type: this.getTypeFromCurseID(asset.categorySection.gameCategoryId),
        installed: false,
        hosts: {
          curse: {
            id: asset.id,
            slug: asset.slug,
            downloadCount: asset.downloadCount,
            latestFileID: asset.defaultFileId,
            dateCreated: asset.dateCreated,
            dateReleased: asset.dateReleased,
            dateModified: asset.dateModified,

            localValues: {
              gameVerLatestFiles: asset.gameVersionLatestFiles
            }
          }
        }
      };

      if (asset.attachments && asset.attachments.length) {
        const attachment = asset.attachments.find(a => a.isDefault);
        if (attachment) {
          obj.icon = attachment.url;
          obj.iconPath = attachment.url;
          obj.iconURL = attachment.url;
        } else if (!attachment && asset.attachments[0]) {
          obj.icon = asset.attachments[0].url;
          obj.iconPath = asset.attachments[0].url;
          obj.iconURL = asset.attachments[0].url;
        }
      }

      return obj;
    }

    logger.error('Asset does not exist when converting to OMAF!');
    return undefined;
  },

  getTypeFromCurseID(id) {
    switch (id) {
      case 4471:
        return 'profile';
      case 6:
        return 'mod';
      case 12:
        return 'resourcepack';
      case 17:
        return 'world';
      default:
        return undefined;
    }
  },

  getCurseIDFromType(type) {
    switch (type) {
      case 'profile':
        return 4471;
      case 'mod':
        return 6;
      case 'resourcepack':
        return 12;
      case 'world':
        return 17;
      default:
        return undefined;
    }
  },

  // read a list of curse assets (typically returned by a search function)
  readAssetList(list) {
    return list.map(asset => {
      const type = this.getTypeFromCurseID(asset.categorySection.gameCategoryId);

      const omaf = this.convertToOMAF(asset);
      let obj;
      if (type === 'profile') {
        obj = new Profile(omaf);
      } else if (type === 'mod') {
        obj = new Mod(omaf);
      } else if (type === 'resourcepack') {
        obj = new OMAFFileAsset(omaf);
      } else if (type === 'world') {
        obj = new World(omaf);
      }

      Global.cacheImage(obj.icon);

      Hosts.cache.assets[omaf.cachedID] = omaf;

      return obj;
    });
  },

  async getDescription(asset) {
    return Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}/description`, {
      addonID: asset.hosts.curse.id
    });
  },

  convertCurseVersion(ver) {
    const cacheID = `versioncache-curse-${new Date(ver.fileDate).getTime()}`;
    let inferredModloader;
    if (ver.modules.find(module => module.foldername === 'fabric.mod.json')) {
      inferredModloader = 'fabric';
    } else {
      inferredModloader = 'forge';
    }
    const obj = {
      displayName: ver.displayName,
      timestamp: new Date(ver.fileDate).getTime(),
      minecraft: {
        supportedVersions: ver.gameVersion
      },
      cachedID: cacheID,
      TEMP: {
        downloadUrl: ver.downloadUrl
      },
      hosts: {
        curse: {
          fileID: ver.id,
          localValues: {
            inferredModloader
          }
        }
      }
    };

    Global.cached.versions[cacheID] = obj;
    return obj;
  },

  async getFileInfo(asset, fileID) {
    const res = await Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}/file/${fileID}`);
    if (res) return res;
    return undefined;
  },

  async addFileInfo(assetT, fileID) {
    const asset = assetT;
    const info = await this.getFileInfo(asset, fileID);

    if (info) {
      asset.version = this.convertCurseVersion(info);
      asset.hosts.curse.fileID = fileID;
      asset.hosts.curse.fileName = info.fileName;
      asset.downloadTemp = info.downloadUrl;

      asset.dependencies = info.dependencies
        .filter(depend => depend.type === 3)
        .map(dependency => ({
          hosts: {
            curse: {
              id: dependency.addonId
            }
          }
        }));

      Hosts.cache.assets[asset.cachedID] = asset;
      return asset;
    }

    return undefined;
  },

  async getInfo(asset) {
    return Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}`);
  },

  async getFullAsset(asset, type) {
    if (asset && asset.hosts && asset.hosts.curse) {
      const info = await this.getInfo(asset);

      if (type === 'mod') {
        return new Mod(this.convertToOMAF(info));
      }

      return this.convertToOMAF(info);
    }

    return undefined;
  },

  convertSortString(string) {
    switch (string) {
      case 'popular':
        return 1;
      case 'a-z':
        return 3;
      case 'updated':
        return 2;
      case 'featured':
        return 0;
      case 'author':
        return 4;
      case 'downloads':
        return 5;
      default:
        return 1;
    }
  },

  // search for an asset
  async search(type, term, options = { sort: 'popular', minecraftVersion: 'All' }) {
    const sort = this.convertSortString(options.sort);

    const params = {
      searchFilter: term.split(' ').join('+'),
      gameId: 432,
      sectionId: this.getCurseIDFromType(type),
      categoryId: 0,
      sort,
      pageSize: 25,
      index: 0
    };

    if (options.minecraftVersion !== 'All') {
      params.gameVersion = options.minecraftVersion;
    }

    logger.info(`Searching ${type}s for "${term}"`);
    const result = await Hosts.HTTPGet(`${this.URL_BASE}/search`, params);

    if (result) {
      const al = this.readAssetList(result);

      if (term.trim()) {
        const readyToSort = al.map(assetRaw => {
          const asset = assetRaw;
          asset.searchName = asset.name.replace(/[^\w]/gi, ' ');
          return asset;
        });

        const fuzzed = fuzzysort.go(term, readyToSort, { key: 'searchName', threshold: -Infinity, allowTypo: true });
        const sorted = fuzzed.map(res => res.obj);

        return [...sorted, ...al.filter(res => !sorted.find(mod => mod.id === res.id))];
      }

      return al;
    }

    return undefined;
  },

  // add potentially missing info (e.g. description) to an asset
  async addMissingInfo(info, assetT) {
    logger.info(`Adding missing info "${info}" to asset ${assetT.id}`);
    const asset = assetT;
    if (info === 'description') {
      const desc = await this.getDescription(asset);
      asset.description = desc;
      if (!asset.cachedID) {
        asset.cachedID = `curse-cached-${Global.createID(asset.name)}`;
      }
      Hosts.cache.assets[asset.cachedID] = asset;
      return asset;
    }

    return undefined;
  },

  // gets the popular assets for a certain asset type (e.g. mod)
  async getPopularAssets(type, options = { sort: 'popular', minecraftVersion: 'All' }) {
    logger.info('Getting popular assets');
    const res = await this.search(type, '', options);
    if (res) {
      Hosts.cache.popular.curse[type] = res;
      Hosts.cache.popular.curse.options = options;

      return res;
    }

    return undefined;
  },

  // gets the dependencies required for an asset
  async getDependencies(assetT) {
    const asset = assetT;
    logger.info(`Getting dependencies for ${asset.hosts.curse.slug}`);

    let newAsset;
    if (!asset.installed) {
      newAsset = await this.addFileInfo(asset, asset.hosts.curse.latestFileID);
    } else {
      newAsset = await this.addFileInfo(asset, asset.hosts.curse.fileID);
    }

    if (newAsset) {
      // eslint-disable-next-line no-return-await
      const final = await Promise.all(newAsset.dependencies.map(dependency => this.getFullAsset(dependency)));

      if (!asset.cachedID) {
        asset.cachedID = `curse-cached-${Global.createID(asset.name)}`;
      }
      Hosts.cache.assets[asset.cachedID].dependencies = final;
      return final;
    }

    return undefined;
  },

  // gets the versions for an asset
  async getVersions(assetT) {
    const asset = assetT;
    logger.info(`Getting versions for ${asset.id}`);
    const results = await Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}/files`);
    if (results) {
      const sorted = results.sort((a, b) => new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime());
      const final = sorted.map(ver => this.convertCurseVersion(ver));

      if (!asset.cachedID) {
        asset.cachedID = `curse-cached-${Global.createID(asset.name)}`;
      }

      if (!Hosts.cache.assets[asset.cachedID]) {
        Hosts.cache.assets[asset.cachedID] = asset;
      }

      Hosts.cache.assets[asset.cachedID].hosts.curse.versionCache = final;

      return final;
    }

    return undefined;
  },

  // gets the latest version of the asset available for a specific minecraft version
  async getLatestVersionForMCVersion(asset, mcVersion, modloader) {
    logger.info(`Getting latest version of ${asset.id} for MC version ${mcVersion} and modloader ${modloader}`);
    if (asset.hosts.curse.localValues && asset.hosts.curse.localValues.gameVerLatestFiles) {
      // curse does a terrible job indicating whether a file is forge or fabric
      // we have to make a bunch of guesses

      // now it's time to verify modloader compatibility

      const versions = await this.getVersions(asset);
      const file = versions.find(ver => {
        let modloaderEqual = false;
        if (asset.type === 'mod' || asset instanceof Mod) {
          if (ver.hosts.curse.localValues.inferredModloader === modloader) {
            modloaderEqual = true;
          }
        } else {
          modloaderEqual = true;
        }
        return ver.minecraft.supportedVersions.includes(mcVersion) && modloaderEqual;
      });

      if (file) {
        file.projectFileId = file.hosts.curse.fileID;
        return file;
      }

      return undefined;
    }

    return this.getLatestVersionForMCVersion(await this.getFullAsset(asset), mcVersion, modloader);
  },

  // gets the closest version of an asset to a minecraft version, but only an older version
  async getClosestOlderVersion(asset, mcVersion) {
    if (asset.hosts.curse.localValues && asset.hosts.curse.localValues.gameVerLatestFiles) {
      const preferredVerIndex = Global.ALL_VERSIONS.indexOf(mcVersion);
      const futureVersionsRemoved = asset.hosts.curse.localValues.gameVerLatestFiles.filter(
        version => Global.ALL_VERSIONS.indexOf(version.gameVersion) >= preferredVerIndex
      );

      if (futureVersionsRemoved[0]) return futureVersionsRemoved[0].gameVersion;
      return undefined;
    }

    return this.getClosestOlderVersion(await this.getFullAsset(asset), mcVersion);
  },

  // gets the changelog from a file id
  async getFileChangelog(asset, fileID) {
    logger.info(`Getting changelog for ${asset.id} and file ${fileID}`);
    return Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}/file/${fileID}/changelog`);
  },

  // checks if an update is available for an asset
  async checkForAssetUpdates(asset) {
    const versions = await Hosts.getVersions('curse', asset);
    let newver;
    if (versions) {
      // eslint-disable-next-line no-restricted-syntax
      for (const ver of versions.slice().reverse()) {
        if (new Date(ver.timestamp).getTime() > asset.version.timestamp) {
          newver = ver;
        }
      }
    } else {
      return 'no-connection';
    }
    return newver;
  }
};

export default Curse;
