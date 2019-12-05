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
                console.log(attachment);
                obj.iconpath = attachment.url;
            }
        }

        console.log(obj);
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
            console.log(asset);
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

        console.log('resu;l');
        console.log(result);

        if(result) return this.readAssetList(JSON.parse(result));
        return undefined;
    }
};

export default CurseRework;