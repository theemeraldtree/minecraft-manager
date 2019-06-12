import HTTPRequest from "../httprequest";
import Mod from "../../type/mod";

let Curse = {
    getCurseListItems(url) {
        return new Promise((resolve) => {
            console.log(url);
            HTTPRequest.cheerioRequest(url).then((page) => {
                let pageType = 'curseforge';
                let results = [];
                page('.project-list-item').each((i, el) => {
                    if(pageType === 'curseforge') {

                        // This code is sloppy only because parsing some scraped HTML isn't neat and tidy
                        let data = el.children[1];
                        let details = data.children[3];
                        let name = details.children[1].children[1].children[0].data.trim();
                        let url = details.children[1].attribs.href;
                        let description = details.children[5].children[1].attribs.title.trim();
                        let icon = data.children[1].children[1].children[1].children[1].attribs.src;
                        let id = url.split('/')[3];


                                                
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
                            res.hosts.curse = {};
                            res.hosts.curse.id = id;
                        }
                        results.push(res);
                    }
                })
                resolve(results);
            })
        })
    },
    getPopular(type) {
        let cursetype;
        if(type === 'mods') {
            cursetype = 'mc-mods';
        }else{
            cursetype = type;
        }
        return new Promise((resolve) => {
            this.getCurseListItems(`https://curseforge.com/minecraft/${cursetype}`).then((result) => {
                resolve(result);
            })
        })
    }
}

export default Curse;