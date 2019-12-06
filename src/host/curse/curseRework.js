import Global from "../../util/global";
import Profile from "../../type/profile";
import Mod from "../../type/mod";
import Hosts from "../Hosts";
import LogManager from "../../manager/logManager";

// the curse object is used as a sort of "translator" to convert curse's data format to work with OMAF
const CurseRework = {
    
    URL_BASE: `https://addons-ecs.forgesvc.net/api/v2/addon`,

    // main function to convert curse to omaf
    convertToOMAF(asset) {
        const id = Global.createID(asset.name);
        let obj = {
            name: asset.name,
            id: id,
            blurb: asset.summary,
            url: asset.websiteUrl,
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
        }

        if(asset.attachments && asset.attachments.length) {
            let attachment = asset.attachments.find(a => a.isDefault);
            if(attachment) {
                obj.iconURL = attachment.url;
                obj.iconpath = attachment.url;
            }
        }

        return obj;
    },

    getTypeFromCurseID(id) {
        switch(id) {
            case 4471:
                return 'profile';
            case 6:
                return 'mod';
            case 12:
                return 'resourcepack';
            case 17:
                return 'world';
        }
    },

    getCurseIDFromType(type) {
        switch(type) {
            case 'profile':
                return 4471;
            case 'mod':
                return 6;
            case 'resourcepack':
                return 12;
            case 'world':
                return 17;
        }
    },

    // read a list of curse assets (typically returned by a search function)
    readAssetList(list) {
        return list.map(asset => {
            const type = this.getTypeFromCurseID(asset.categorySection.gameCategoryId);

            const omaf = this.convertToOMAF(asset);
            let obj;
            if(type === 'profile') {
                obj = new Profile(omaf);
            }else if(type === 'mod') {
                obj = new Mod(omaf);
            }

            Global.cacheImage(obj.iconURL);

            Hosts.cache.assets[omaf.cachedID] = omaf;

            return obj;
        });
    },

    async getDescription(asset) {
        return await Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}/description`, {
            addonID: asset.hosts.curse.id
        });
    },

    convertCurseVersion(ver) {
        const cacheID = `versioncache-curse-${new Date(ver.fileDate).getTime()}`;
        const obj = {
            displayName: ver.displayName,
            timestamp: new Date(ver.fileDate).getTime(),
            minecraftversions: ver.gameVersion,
            cachedID: cacheID,
            TEMP: {
                downloadUrl: ver.downloadUrl,
            },
            hosts: {
                curse: {
                    fileID: ver.id
                }
            }
        };

        Global.cached.versions[cacheID] = obj;
        return obj;
    },

    async getFileInfo(asset, fileID) {
        const res = await Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}/file/${fileID}`);
        if(res) return JSON.parse(res);
        return undefined;
    },

    async addFileInfo(asset, fileID) {
        const info = await this.getFileInfo(asset, fileID);

        if(info) {
            asset.version = this.convertCurseVersion(info);
            asset.hosts.curse.fileID = fileID;
            asset.hosts.curse.fileName = info.fileName;
            asset.downloadTemp = info.downloadUrl;

            asset.dependencies = info.dependencies.map(dependency => {
                if(dependency.type === 3) {
                    return {
                        hosts: {
                            curse: {
                                id: dependency.addonId
                            }
                        }
                    }
                }
            });

            Hosts.cache.assets[asset.cachedID] = asset;
            return asset;
        }

        return undefined;
    },

    async getInfo(asset) {
        return JSON.parse(await Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}`));
    },

    async getFullAsset(asset, type) {
        const info = await this.getInfo(asset);

        if(type === 'mod') {
            return new Mod(this.convertToOMAF(info));
        }

        return this.convertToOMAF(info);
    },

    // search for an asset
    async search(type, term) {
        LogManager.log('info', `[Curse] Searching ${type}s for ${term}`);
        const result = await Hosts.HTTPGet(`${this.URL_BASE}/search`, {
            searchFilter: term.split(' ').join('%20'),
            gameId: 432,
            sectionId: this.getCurseIDFromType(type),
            categoryId: 0,
            sort: 0,
            pageSize: 20,
            index: 0
        });

        if(result) return this.readAssetList(JSON.parse(result));
        return undefined;
    },

    // add potentially missing info (e.g. description) to an asset
    async addMissingInfo(info, asset) {
        if(info === 'description') {
            const desc = await this.getDescription(asset);
            asset.description = desc;
            if(!asset.cachedID) {
                asset.cachedID = `curse-cached-${Global.createID(asset.name)}`;
            }
            Hosts.cache.assets[asset.cachedID] = asset;
            return asset;
        }
    },

    // gets the popular assets for a certain asset type (e.g. mod)
    async getPopularAssets(type) {
        const res = await this.search(type, '');
        if(res) {
            Hosts.cache.popular.curse[type] = res;
            return res;
        }

        return undefined;
    },

    // gets the dependencies required for an asset
    async getDependencies(asset) {
        let newAsset;
        if(!asset.installed) {
            newAsset = await this.addFileInfo(asset, asset.hosts.curse.latestFileID);
        }else{
            newAsset = await this.addFileInfo(asset, asset.hosts.curse.fileID);
        }

        if(newAsset) {
            let final = [];
            for(let dependency of newAsset.dependencies) {
                final.push(await this.getFullAsset(dependency));
            }

            if(!asset.cachedID) {
                asset.cachedID = `curse-cached-${Global.createID(asset.name)}`;
            }
            Hosts.cache.assets[asset.cachedID].dependencies = final;
            return final;
        }

        return undefined;
    },

    // gets the versions for an asset
    async getVersions(asset) {
        const req = await Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}/files`);
        if(req) {
            const results = JSON.parse(req);
            let sorted = results.sort((a, b) => {
                return new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime()
            });
            const final = sorted.map(ver => ver = this.convertCurseVersion(ver));

            if(!asset.cachedID) {
                asset.cachedID = `curse-cached-${Global.createID(asset.name)}`;
            }

            if(!Hosts.cache.assets[asset.cachedID]) {
                Hosts.cache.assets[asset.cachedID] = asset;
            }

            Hosts.cache.assets[asset.cachedID].hosts.curse.versionCache = final;
            return final;
        }

        return undefined;
    },

    // gets the latest version of the asset available for a specific minecraft version
    async getLatestVersionForMCVersion(asset, mcVersion) {
        if(asset.hosts.curse.localValues && asset.hosts.curse.localValues.gameVerLatestFiles) {
            return asset.hosts.curse.localValues.gameVerLatestFiles.find(ver => ver.gameVersion === mcVersion);
        }else{
            const fullAsset = this.getFullAsset(asset);
            const res = await this.getLatestVersionForMCVersion(fullAsset, mcVersion);
            return res;
        }
    },

    // gets the changelog from a file id
    async getFileChangelog(asset, fileID) {
        return await Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}/file/${fileID}/changelog`);
    }
};

export default CurseRework;