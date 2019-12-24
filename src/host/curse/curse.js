import Global from "../../util/global";
import Profile from "../../type/profile";
import Mod from "../../type/mod";
import Hosts from "../Hosts";
import LogManager from "../../manager/logManager";
import DownloadsManager from "../../manager/downloadsManager";
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

const admzip = require('adm-zip');

// the curse object is used as a sort of "translator" to convert curse's data format to work with OMAF
const Curse = {
    
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
        let inferredModloader;
        if(ver.modules.find(module => module.foldername === 'fabric.mod.json')) {
            inferredModloader = 'fabric';
        }else{
            inferredModloader = 'forge';
        }
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
                    fileID: ver.id,
                    localValues: {
                        inferredModloader: inferredModloader
                    }
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
    async getLatestVersionForMCVersion(asset, mcVersion, modloader) {
        if(asset.hosts.curse.localValues && asset.hosts.curse.localValues.gameVerLatestFiles) {
            // curse does a terrible job indicating whether a file is forge or fabric
            // we have to make a bunch of guesses
                
            // now it's time to verify modloader compatibility

            const versions = await this.getVersions(asset);
            const file = versions.find(ver => {
                return (
                    ver.minecraftversions.includes(mcVersion) &&
                    ver.hosts.curse.localValues.inferredModloader === modloader
                );
            });
            

            if(file) {
                file.projectFileId = file.hosts.curse.fileID;
                return file;
            }
            
            return undefined;
        }




        return await this.getLatestVersionForMCVersion(await this.getFullAsset(asset), mcVersion, modloader);
    },

    // gets the changelog from a file id
    async getFileChangelog(asset, fileID) {
        return await Hosts.HTTPGet(`${this.URL_BASE}/${asset.hosts.curse.id}/file/${fileID}/changelog`);
    },

    // downloads, extracts, and reads the version of a modpack to get the mods list
    async downloadModsListFromModpack(mp, downloadUrl) {
        return new Promise(resolve => {

            const modpack = mp;
            const infoDownload = path.join(Global.MCM_TEMP, `${modpack.id}-install.zip`);
            
            DownloadsManager.startFileDownload(`${modpack.name}\n_A_Info`, downloadUrl, infoDownload).then(async () => {
                const zip = new admzip(infoDownload);
    
                const extractPath = path.join(Global.MCM_TEMP, `${modpack.id}-install/`);
                zip.extractAllTo(extractPath, false);
                fs.unlinkSync(infoDownload);
    
                const manifest = JSON.parse(fs.readFileSync(path.join(extractPath, 'manifest.json')));
    
                const list = manifest.files.map(file => {
                    const mod = new Mod({
                        hosts: {
                            curse: {
                                id: file.projectID,
                                fileID: file.fileID
                            }
                        },
                        cachedID: `curse-mod-install-${file.projectID}`
                    });
                    return mod;
                });
                resolve(list);
            })
        })
    },

    // copies the overrides after a modpack has been downloaded (and is in temp folder)
    async copyModpackOverrides(profile) {
        const extractPath = path.join(Global.MCM_TEMP, `${profile.id}-install/`);
        const overridesFolder = path.join(extractPath, `/overrides`);
        if(fs.existsSync(overridesFolder)) {
            fs.readdirSync(overridesFolder).forEach(file => {
                if(file === 'mods') {
                    fs.readdirSync(path.join(overridesFolder, file)).forEach(f => {
                        Global.copyDirSync(path.join(overridesFolder, file, f), path.join(profile.gameDir, file, f));
                    })
                }else{
                    Global.copyDirSync(path.join(overridesFolder, file), path.join(profile.gameDir, file));
                }
            })
        }
    },

    // removes leftover files (e.g. extract directory) from modpack install
    async cleanupModpackInstall(profile) {
        const extractPath = path.join(Global.MCM_TEMP, `${profile.id}-install/`);
        rimraf.sync(extractPath);
    },

    // gets the forge version from the extractpath
    getForgeVersionForModpackInstall(profile) {
        const manifest = JSON.parse(fs.readFileSync(path.join(Global.MCM_TEMP, `${profile.id}-install/manifest.json`)));
        return `${manifest.minecraft.version}-${manifest.minecraft.modLoaders[0].id.substring(6)}`;
    },

    // gets the minecraft version from the extractpath
    getMinecraftVersionFromModpackInstall(modpack) {
        const manifest = JSON.parse(fs.readFileSync(path.join(Global.MCM_TEMP, `${modpack.id}-install/manifest.json`)));
        return manifest.minecraft.version;
    },

    // checks if an update is available for an asset
    async checkForAssetUpdates(asset) {
        const versions = await Hosts.getVersions('curse', asset);
        let newver;
        for(let ver of versions.slice().reverse()) {
            if(new Date(ver.timestamp).getTime() > asset.version.timestamp) {
                newver = ver;
            }
        }
        return newver;
    }

};

export default Curse;