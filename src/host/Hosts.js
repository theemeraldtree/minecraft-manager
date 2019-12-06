import ToastManager from "../manager/toastManager";
import HTTPRequest from "./httprequest";
import CurseRework from "./curse/curseRework";

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
    }

}

export default Hosts;