import HttpRequest from "../HttpRequest";
import Data from "../../util/data";
import Mod from "../../util/mod";

class Curse {
    static getCurseListItems(url) {
        return new Promise((resolve) => {
            HttpRequest.cheerioRequest(url).then((page) => {
                let pageType = 'curseforge';
                let results = [];
                page('.project-list-item').each((i, el) => {
                    if(pageType === 'curseforge') {
                        let data = el.children[1];
                        let details = data.children[3];
                        let name = details.children[1].children[1].children[0].data.trim();
                        let url = details.children[1].attribs.href;
                        let description = details.children[5].children[1].children[0].data.trim();
                        let icon = data.children[1].children[1].children[1].children[1].attribs.src;
                        let id = url.split('/')[3];
                        if(!icon) {
                            icon = Data.getMCMIcon();
                        }
                        
                        console.log(details);
                        
                        let type;
                        if(url.indexOf('mc-mods') !== -1) {
                            type = 'mod';
                        }else{
                            type = 'unknown';
                        }
    
                        let res;
                        if(type === 'mod') {
                            res = new Mod();
                            res.name = name;
                            res.description = description;
                            res.iconpath = icon;
                            res.url = `https://curseforge.com${url}`;
                            res.installed = false;
                            res.ids.curse = id;
                        }
                        results.push(res);
                    }
                })
                resolve(results);
            })
        })
    }
    /**
     * Search curseforge with specific type:
     * modpack
     * mod
     */
    static search(src, term) {
        return new Promise((resolve) => {
            if(src === 'mod') {
                this.getCurseListItems(`https://www.curseforge.com/minecraft/mc-mods/search?search=${term}`).then((res) => {
                    resolve(res);
                }) 
            }
        })

    }
}

export default Curse;