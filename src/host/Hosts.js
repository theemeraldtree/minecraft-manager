import ToastManager from "../manager/toastManager";
import HTTPRequest from "./httprequest";
import Curse from "./curse/curse";
import fs from 'fs';
import path from 'path';
import DownloadsManager from "../manager/downloadsManager";
import Mod from "../type/mod";
import Global from "../util/global";
import ProfilesManager from "../manager/profilesManager";
import ForgeManager from "../manager/forgeManager";

const Hosts = {

    /* shared functions for hosts */
    cache: {
        popular: {
            curse: {

            }
        },
        assets: {

        }
    },
    
    concurrentDownloads: [],

    async sendCantConnect() {
        ToastManager.createToast('Whoops!', "Looks like we can't connect to Curse right now. Check your internet connection and try again.");
    },

    async HTTPGet(url, qs, tries) {
        try {
            return await HTTPRequest.get(url, qs);
        }catch(err) {
            if(!tries) {
                return await this.HTTPGet(url, qs, 1);
            }else{
                if(tries !== 3) {
                    return await this.HTTPGet(url, qs, tries + 1);
                }else{
                    this.sendCantConnect();
                    return undefined;
                }
            }
        }
    },
    

    /* functions for using hosts */
    async getTopAssets(host, assetType) {
        if(host === 'curse') {
            if(!this.cache.popular.curse[assetType]) {
                return await Curse.getPopularAssets(assetType);
            }
            
            return this.cache.popular.curse[assetType];
        }
    },

    async getDependencies(host, asset) {
        if(host === 'curse') {
            return await Curse.getDependencies(asset);
        }
    },

    async getVersions(host, asset) {
        if(host === 'curse') {
            if(this.cache.assets[asset.cachedID]) {
                const versionCache = this.cache.assets[asset.cachedID].hosts.curse.versionCache;
                if(versionCache) return versionCache;
            }

            return await Curse.getVersions(asset);
        }
    },

    async checkForAssetUpdates(host, asset) {
        if(host === 'curse') {
            return await Curse.checkForAssetUpdates(asset);
        }
    },

    async getLatestVersionForMCVersion(host, asset, mcVersion) {
        if(host === 'curse') {
            return await Curse.getLatestVersionForMCVersion(asset, mcVersion);
        }
    },

    async getFileChangelog(host, asset, fileID) {
        if(host === 'curse') {
            return await Curse.getFileChangelog(asset, fileID);
        }
    },

    async searchAssets(host, assetType, searchTerm) {
        if(host === 'curse') {
            return await Curse.search(assetType, searchTerm); 
        }
    },

    async addMissingInfo(host, info, asset) {
        if(host === 'curse') {
            return await Curse.addMissingInfo(info, asset);
        }
    },

    async cacheAllAssetInfo(host, asset) {
        if(!this.cache.assets[asset.cachedID]) {
            this.cache.assets[asset.cachedID] = asset;
        }

        let cachedAsset = this.cache.assets[asset.cachedID];

        if(cachedAsset !== asset) {
            this.cache.assets[asset.cachedID] = asset;
        }

        if(!cachedAsset.description) {
            let newAsset = await this.addMissingInfo(host, 'description', cachedAsset);
            this.cache.assets[asset.cachedID] = newAsset;
        }
    },

    async downloadModList(host, profile, list, callback, onUpdate, concurrent) {
        if(concurrent !== 0 && concurrent !== undefined) {
            for(let i = 0; i < concurrent - 1; i++) {
                this.downloadModList(host, profile, list, callback, onUpdate);
            }
        }

        if(list.length === 0) {
            callback();
        }else{
            const item = Object.assign({}, list[0]);
            if(this.concurrentDownloads.includes(item.cachedID)) {
                const list2 = list.slice();
                list2.shift();
                this.downloadModList(host, profile, list2, callback, onUpdate);
            }else{
                this.concurrentDownloads.push(item.cachedID);
                const mod = await this.installModVersionToProfile(host, profile, item, false);
                this.cache.assets[item.cachedID] = mod;
                onUpdate();
                list.shift();
                this.downloadModList(host, profile, list, callback, onUpdate);
            }
        }
    },

    /* installers */
    async installModToProfile(host, profile, mod) {
        if(!mod.name) {
            if(host === 'curse') {
                mod = await Curse.getFullAsset(mod, 'mod');
            }
        }

        const ver = await this.getLatestVersionForMCVersion(host, mod, profile.minecraftversion);
        if(!ver) {
            return 'no-version-available';
        }

        let newMod;
        if(host === 'curse') {
            newMod = await Curse.addFileInfo(mod, ver.projectFileId);
        }

        return await this.installModVersionToProfile(host, profile, newMod, true);
    },

    async installDependencies(host, profile, asset) {
        if(asset.dependencies) {
            for(let depend of asset.dependencies) {
                if(depend.hosts.curse && depend.hosts.curse.fileID) {
                    this.installModVersionToProfile(host, profile, depend);
                }else{
                    this.installModToProfile(host, profile, depend);
                }
            }
        }
    },

    async installModVersionToProfile(host, profile, mod, dependencies) {
        return new Promise(async resolve => {
            if(!fs.existsSync(path.join(profile.gameDir, `/mods/${mod.id}.jar`))) {
                if(!mod.name) {
                    if(host === 'curse') {
                        let newm = await Curse.getFullAsset(mod, 'mod');
                        newm.hosts.curse.fileID = mod.hosts.curse.fileID;
                        mod = newm;
                    }
                }
    
                DownloadsManager.createProgressiveDownload(`${mod.name}\n_A_`).then(async download => {
                    if(dependencies) {
                        this.installDependencies(host, profile, mod);
                    }
    
    
                    DownloadsManager.removeDownload(download.name);
    
                    if(!mod.downloadTemp) {
                        if(host === 'curse') {
                            mod = await Curse.addFileInfo(mod, mod.hosts.curse.fileID);
                        }
                    }
    
                    const modObj = new Mod(mod);
    
                    DownloadsManager.startModDownload(profile, mod, mod.downloadTemp, false).then(async () => {
                        modObj.setJARFile(`${mod.id}.jar`);
                        if(!profile.getModFromID(mod.id)) {
                            profile.addMod(modObj);
                        }
    
                        if(profile.progressState[mod.id]) {
                            profile.progressState[mod.id] = {
                                progress: 'installed',
                                version: mod.version.displayName
                            }
                        }
    
                        resolve(mod);
                    })
                })
            }else{
                resolve(mod);
            }
        });
    },

    async installModpackVersion(host, modpack, version) {
        return new Promise(async resolve => {
            if(!fs.existsSync(Global.MCM_TEMP)) {
                fs.mkdirSync(Global.MCM_TEMP);
            }

            const versions = await this.getVersions(host, modpack);

            let verObj, downloadUrl;
            const versionIsNumber = parseInt(version);
            for(let ver of versions) {
                if(versionIsNumber &&
                    (ver.hosts.curse.fileID === parseInt(version)) ||
                    !versionIsNumber &&
                    (ver.displayName === version)) {
                        verObj = ver;
                        downloadUrl = ver.TEMP.downloadUrl;
                }
            }

            await this.cacheAllAssetInfo(host, modpack);

            let mods = [];

            if(host === 'curse') {
                mods = await Curse.downloadModsListFromModpack(modpack, downloadUrl);
            }

            let minecraftVersion;
            if(host === 'curse') {
                minecraftVersion = Curse.getMinecraftVersionFromModpackInstall(modpack);
            }

            ProfilesManager.createProfile(modpack.name, minecraftVersion).then(async profile => {
                if(!modpack.iconURL) {
                    if(host === 'curse') {
                        modpack = await Curse.getFullAsset(modpack);
                    }
                }
                profile.hosts = modpack.hosts;
                profile.iconURL = modpack.iconURL;
                profile.blurb = modpack.blurb;
                profile.description = modpack.description;

                profile.setProfileVersion(verObj);
                profile.changeMCVersion(minecraftVersion);
                profile.setForgeInstalled(true);
                if(host === 'curse') {
                    profile.hosts.curse.fullyInstalled = false;
                    profile.hosts.curse.fileID = verObj.id;
                    profile.hosts.curse.fileName = version.fileName;
                    profile.setForgeVersion(Curse.getForgeVersionForModpackInstall(modpack));
                }

                profile.save();
                profile.setCurrentState('installing');
                
                ProfilesManager.updateProfile(profile);
                DownloadsManager.createProgressiveDownload(`Mods\n_A_${modpack.name}`).then(download => {
                    let numberDownloaded = 0;
                    const concurrent = mods.length >= 10 ? 10 : 0;
                    this.downloadModList(host, profile, mods.slice(), async () => {
                        if(numberDownloaded === mods.length) {
                            DownloadsManager.removeDownload(download.name);
                            this.concurrentDownloads = [];
                            
                            if(host === 'curse') {
                                await Curse.copyModpackOverrides(profile);
                            }

                            ForgeManager.setupForge(profile).then(() => {
                                DownloadsManager.startFileDownload(`Icon\n_A_${profile.name}`, profile.iconURL, path.join(profile.folderpath, '/icon.png')).then(async () => {
                                    if(host === 'curse') {
                                        await Curse.cleanupModpackInstall(profile);
                                        profile.hosts.curse.fullyInstalled = true;
                                    }

                                    profile.save();
                                    profile.addIconToLauncher();
                                    ProfilesManager.progressState[profile.id] = {
                                        progress: 'installed',
                                        version: profile.version.displayName
                                    }
                                    if(!modpack.cachedID) {
                                        modpack.cachedID = `${host}-cached-${modpack.id}`;
                                    }
                                    this.cache.assets[modpack.cachedID] = profile;
                                    ProfilesManager.profilesBeingInstalled.splice(ProfilesManager.profilesBeingInstalled.indexOf(modpack.id), 1);
                                    resolve(profile);
                                })
                            })
                        }
                    }, () => {
                        numberDownloaded++;
                        DownloadsManager.setDownloadProgress(download.name, Math.ceil((numberDownloaded/mods.length) * 100));
                    }, concurrent);
                })
            })
        })
    },

    async installModpack(host, modpack) {
        if(!fs.existsSync(Global.MCM_TEMP)) {
            fs.mkdirSync(Global.MCM_TEMP);
        }

        let cachedAsset = this.cache.assets[modpack.cachedID];
        let latestFileID;

        if(cachedAsset.hosts.curse) {
            if(!cachedAsset.hosts.curse.fileID) {
                const newModpack = await Curse.addFileInfo(cachedAsset, modpack.hosts.curse.latestFileID);
                this.cache.assets[modpack.cachedID] = newModpack;
            }
        }

        const mp = cachedAsset;

        if(host === 'curse') {
            latestFileID = mp.hosts.curse.latestFileID;
        }

        await this.installModpackVersion(host, mp, latestFileID);
     }

}

export default Hosts;