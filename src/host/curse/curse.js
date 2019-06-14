import HTTPRequest from "../httprequest";
import Mod from "../../type/mod";
import Profile from "../../type/profile";
import curseversions from './curseversions.json';
import DownloadsManager from "../../manager/downloadsManager";
import Global from "../../util/global";
let Curse = {
    popularCache: {},
    cachedItems: {},
    getCurseListItems(url) {
        return new Promise((resolve) => {
            if(url.substring(0, 22) === 'https://curseforge.com') {
                HTTPRequest.cheerioRequest(url).then((page) => {
                    let pageType = 'curseforge';
                    let results = [];
                    page('.project-list-item').each((i, el) => {
                        if(pageType === 'curseforge') {
    
                            // This code is sloppy only because parsing some scraped HTML isn't neat and tidy
                            let data = el.children[1];
                            let details = data.children[3];
                            let name = details.children[1].children[1].children[0].data.trim();
                            let url = `https://www.curseforge.com${details.children[1].attribs.href}`;
                            let blurb = details.children[5].children[1].attribs.title.trim();
                            let icon = data.children[1].children[1].children[1].children[1].attribs.src;
                            let id = url.split('/')[5];
    
    
                                                    
                            let type;
                            if(url.indexOf('mc-mods') !== -1) {
                                type = 'mod';
                            }else if(url.indexOf('modpacks') !== -1) {
                                type = 'modpack';
                            }
        
                            let res;
                            if(type === 'mod') {
                                res = this.createMod(name, blurb, url, icon, id);
                            }else if(type === 'modpack') {
                                res = this.createModpack(name, blurb, url, icon, id);
                            }
    
                            results.push(res);
                        }
                    })
                    resolve(results);
                })
            }else{
                HTTPRequest.cheerioRequest(url).then((page) => {
                    let results = [];
                    page('.project-list-item').each((i, el) => {
                        let details = el.children[3];
                        let name = details.children[1].children[1].children[1].children[0].data.trim();
                        let url = details.children[1].children[1].children[1].attribs.href;
                        let blurb = details.children[5].children[1].children[0].data.trim();
                        let icon = el.children[1].children[1].children[1].attribs.src;
                        let id = url.split('/')[4];

                        // testing if the item is a mod by using the categories
                        let res;

                        let categoryURL = details.children[7].children[1].children[1].children[1].attribs.href
                        if(categoryURL.indexOf('mc-mods') !== -1) {
                            res = this.createMod(name, blurb, url, icon, id);
                        }else if(categoryURL.indexOf('modpacks') !== -1) {
                            res = this.createModpack(name, blurb, url, icon, id);
                        }

                        results.push(res);
                    });
                    resolve(results);
                })
            }
        })
    },
    createMod(name, blurb, url, icon, id) {
        let mod = new Mod();
        mod.name = name;
        mod.blurb = blurb;
        mod.url = url;
        mod.iconpath = icon;
        mod.hosts.curse = {};
        mod.hosts.curse.id = id;
        mod.id = Global.createID(name);
        let cachedID = `mod-curse-${id}`;
        mod.cachedID = cachedID;
        this.cachedItems[cachedID] = mod;
        return mod;
    },
    createModpack(name, blurb, url, icon, id) {
        let modpack = new Profile();
        modpack.name = name;
        modpack.blurb = blurb;
        modpack.url = url;
        modpack.iconpath = icon;
        modpack.id = id;
        modpack.hosts.curse = {};
        modpack.hosts.curse.id = id;
        let cachedID = `modpack-curse-${id}`;
        modpack.cachedID = cachedID;
        this.cachedItems[cachedID] = modpack;
        return modpack;
    },
    getCurseType(type) {
        if(type === 'mods') {
            return 'mc-mods'
        }else{
            return type;
        }
    },
    search(term, type) {
        return new Promise((resolve) => {
            this.getCurseListItems(`https://curseforge.com/minecraft/${this.getCurseType(type)}/search?search=${term.split(' ').join('+')}`).then((res) => {
                resolve(res);
            })
        })
    },
    getPopular(type) {
        if(!this.popularCache[type]) {
            return new Promise((resolve) => {
                this.getCurseListItems(`https://curseforge.com/minecraft/${this.getCurseType(type)}`).then((result) => {
                    resolve(result);
                    this.popularCache[type] = result;
                })
            })
        }else{
            return new Promise((resolve) => {
                resolve(this.popularCache[type]);
            })
        }
    },
    getInfo(obj) {
        return new Promise((resolve) => {
            if(!this.cachedItems[obj.cachedID].detailedInfo) {
                // minecraft.curseforge.com is used instead of regular curseforge because it provides more data in one page
                HTTPRequest.cheerioRequest(`https://minecraft.curseforge.com/projects/${obj.hosts.curse.id}`).then((page) => {
                    obj.description = page('.project-description').html();

                    let authors = page('.project-members').toArray()[0].children;
                    let finalAuthorsList = [];
                    for(let author of authors) {
                        if(!author.data) {
                            finalAuthorsList.push(author.children[3].children[1].children[1].children[0].children[0].data);
                        } 
                    }

                    obj.authors = finalAuthorsList;
                    obj.detailedInfo = true;
                    resolve(obj);
                });
            }else{
                resolve(this.cachedItems[obj.cachedID])
            }
        });
    },
    getDependencies(obj) {
        return new Promise((resolve) => {
            if(!this.cachedItems[obj.cachedID].dependencies) {
                let url;
                if(obj instanceof Mod) {
                    url = `https://minecraft.curseforge.com/projects/${obj.hosts.curse.id}/relations/dependencies?filter-related-dependencies=3`
                }else if(obj instanceof Profile) {
                    url = `https://minecraft.curseforge.com/projects/${obj.hosts.curse.id}/relations/dependencies?filter-related-dependencies=6`
                }
                this.getCurseListItems(url).then((res) => {
                    this.cachedItems[obj.cachedID].dependencies = res;
                    resolve(res);
                });
            }else{
                resolve(this.cachedItems[obj.cachedID]);
            }
        })
    },

    getCurseVersionForMCVersion(mcver) {
        return curseversions[mcver];
    },

    getVersionsForMCVersion(obj, mcversion) {
        return new Promise((resolve) => {
            if(!this.cachedItems[obj.cachedID].versions || obj.minecraftversion !== mcversion) {
                let url;
                if(obj instanceof Mod) {
                    url = `https://minecraft.curseforge.com/projects/${obj.hosts.curse.id}/files?filter-game-version=2020709689%3A${this.getCurseVersionForMCVersion(mcversion)}`
                }

                let list = [];
                HTTPRequest.cheerioRequest(url).then((page) => {
                    page('.project-file-list-item').each((i, el) => {
                        let name = el.children[3].children[1].children[3].children[1].children[0].data;
                        let downloadLink = `https://minecraft.curseforge.com${el.children[3].children[1].children[1].children[1].attribs.href}`;

                        list.push({name: name, downloadLink: downloadLink});
                    })
                    this.cachedItems[obj.cachedID].versions = list;
                    resolve(list);
                })
            }else{
                resolve(this.cachedItems[obj.cachedID].versions);
            }
        })
    },
    installMod(profile, mod, modpack) {
        return new Promise((resolve, reject) => {
            this.getDependencies(mod).then(() => {
                this.getVersionsForMCVersion(mod, profile.minecraftversion).then((versions) => {
                    if(versions.length !== 0) {
                        mod.version = versions[0].name;
                        mod.minecraftversion = profile.minecraftversion;
                        console.log(versions[0]);
                        DownloadsManager.startModDownload(profile, mod, versions[0].downloadLink, modpack).then(() => {
                            mod.jar = `${Global.createID(mod.name)}.jar`;
                            profile.addMod(mod);
                            resolve();
                        });
                    }else{
                        reject('invalidVersion');
                    }
                })
            });
        })
    }
}

export default Curse;