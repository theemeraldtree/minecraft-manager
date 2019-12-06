import ToastManager from "../manager/toastManager";
import HTTPRequest from "./httprequest";
import CurseRework from "./curse/curseRework";
import fs from 'fs';
import path from 'path';
import DownloadsManager from "../manager/downloadsManager";
import Curse from "./curse/curse";
import Mod from "../type/mod";

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
                return await CurseRework.getPopularAssets(assetType);
            }
            
            return this.cache.popular.curse[assetType];
        }
    },

    async getDependencies(host, asset) {
        if(host === 'curse') {
            return await CurseRework.getDependencies(asset);
        }
    },

    async getVersions(host, asset) {
        if(host === 'curse') {
            const versionCache = this.cache.assets[asset.cachedID].hosts.curse.versionCache;
            if(versionCache) return versionCache;

            return await CurseRework.getVersions(asset);
        }
    },

    async getLatestVersionForMCVersion(host, asset, mcVersion) {
        if(host === 'curse') {
            return await CurseRework.getLatestVersionForMCVersion(asset, mcVersion);
        }
    },

    async getFileChangelog(host, asset, fileID) {
        if(host === 'curse') {
            return await CurseRework.getFileChangelog(asset, fileID);
        }
    },

    async searchAssets(host, assetType, searchTerm) {
        if(host === 'curse') {
            return await CurseRework.search(assetType, searchTerm); 
        }
    },

    async addMissingInfo(host, info, asset) {
        if(host === 'curse') {
            return await CurseRework.addMissingInfo(info, asset);
        }
    },

    

    /* installers */
    async installModToProfile(host, profile, mod) {
        if(!mod.name) {
            if(host === 'curse') {
                mod = await CurseRework.getFullAsset(mod, 'mod');
            }
        }

        const ver = await this.getLatestVersionForMCVersion(host, mod, profile.minecraftversion);
        if(!ver) {
            return 'no-version-available';
        }

        let newMod;
        if(host === 'curse') {
            newMod = await CurseRework.addFileInfo(mod, ver.projectFileId);
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
                        let newm = await CurseRework.getFullAsset(mod, 'mod');
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
    }

}

export default Hosts;