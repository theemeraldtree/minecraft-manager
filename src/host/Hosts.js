import Curse from "./curse/curse"
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
        console.log(url);
        console.log(qs);
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
            return await Curse.getPopularAssets(assetType);
        }
    },

    async searchAssets(host, assetType, searchTerm) {
        if(host === 'curse') {
            return await CurseRework.search(assetType, searchTerm); 
        }
    }
}

export default Hosts;