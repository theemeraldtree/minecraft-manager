import HTTPRequest from "../httprequest";
import Mod from "../../type/mod";
import Profile from "../../type/profile";
import curseversions from './curseversions.json';
import DownloadsManager from "../../manager/downloadsManager";
import Global from "../../util/global";
import fs from 'fs';
import path from 'path';
import ProfilesManager from "../../manager/profilesManager";
import LogManager from "../../manager/logManager";
import ForgeManager from '../../manager/forgeManager'
import rimraf from 'rimraf';
const admzip = require('adm-zip');
let Curse = {
    popularCache: {},
    cachedItems: {},
    concurrentDownloads: [],
    getCurseListItems(url) {
        return new Promise((resolve) => {
            if(url.substring(0, 22) === 'https://curseforge.com') {
                HTTPRequest.cheerioRequest(url).then((page) => {
                    this.getListItemsFromPage(page, 'curseforge').then((results) => {
                        resolve(results);
                    });
                })
            }else{
                HTTPRequest.cheerioRequest(url).then((page) => {
                    this.getListItemsFromPage(page, 'minecraftcurseforge').then((results) => {
                        resolve(results);
                    })
                })
            }
        })
    },
    getListItemsFromPage(page, type) {
        return new Promise((resolve) => {
            let results = [];
            if(type === 'curseforge') {
                page('.project-list-item').each((i, el) => {
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
                });
                resolve(results);
            }else if(type ==='minecraftcurseforge') {
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
                })
                resolve(results);
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
        return type === 'mods' ? 'mc-mods' : type;
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
    getInfo(obj, tries) {
        return new Promise((resolve, reject) => {
            if(!this.cachedItems[obj.cachedID].detailedInfo) {
                // minecraft.curseforge.com is used instead of regular curseforge because it provides more data in one page
                HTTPRequest.cheerioRequest(`https://minecraft.curseforge.com/projects/${obj.hosts.curse.id}`).then((page) => {
                    obj.description = page('.project-description').html();

                    obj.name = page('.project-title')[0].children[1].children[1].children[0].data;
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
                }).catch((err) => {
                    if(err === 'response-not-found') {
                        if(tries === 3) {
                            reject('try-limit');
                        }else{
                            this.getInfo(obj, tries++).then((res) => {
                                resolve(res);
                            }).catch((err) => {
                                if(err === 'try-limit') {
                                    reject('try-limit');
                                }
                            })
                        }
                    }
                })
            }else{
                resolve(this.cachedItems[obj.cachedID])
            }
        });
    },
    getFileInfo(obj, file, tries) {
        return new Promise((resolve, reject) => {
            if(!this.cachedItems[obj.cachedID].detailedInfo) {
                HTTPRequest.cheerioRequest(`https://minecraft.curseforge.com/projects/${obj.hosts.curse.id}/files/${file}`).then((page) => {
                    obj.name = page('.project-title')[0].children[1].children[1].children[0].data;
            
                    obj.version = page('.details-header')[0].children[3].data;
                    obj.detailedInfo = true;
                    resolve(obj);
                }).catch((err) => {
                    if(err === 'response-not-found') {
                        if(tries === 3) {
                            reject('try-limit');
                        }else{
                            this.getFileInfo(obj, file, tries++).then((res) => {
                                resolve(res);
                            }).catch((err) => {
                                if(err === 'try-limit') {
                                    reject('try-limit');
                                }
                            })
                        }
                    }
                })
            }else{
                resolve(this.cachedItems[obj.cachedID]);
            }
        })
    },
    getDependencies(obj) {
        return new Promise((resolve) => {
            if(!this.cachedItems[obj.cachedID].dependencies) {
                LogManager.log('info', `[Curse] Getting dependencies for ${obj.name}`);
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

    getVersionsFromPage(page) {
        let list = [];
        return new Promise((resolve) => {
            page('.project-file-list-item').each((i, el) => {
                let name = el.children[3].children[1].children[3].children[1].children[0].data;
                let downloadLink = `https://minecraft.curseforge.com${el.children[3].children[1].children[1].children[1].attribs.href}`;

                list.push({name: name, downloadLink: downloadLink});
            })
            resolve(list);
        })
    },
    getVersionsForMCVersion(obj, mcversion, page) {
        return new Promise((resolve) => {
            if(!this.cachedItems[obj.cachedID].versions || obj.minecraftversion !== mcversion) {
                let url;
                if(obj instanceof Mod) {
                    url = `https://minecraft.curseforge.com/projects/${obj.hosts.curse.id}/files?filter-game-version=2020709689%3A${this.getCurseVersionForMCVersion(mcversion)}`
                }

                const callback = (list) => {
                    this.cachedItems[obj.cachedID].versions = list;
                    resolve(list);
                };

                if(!page) {    
                    HTTPRequest.cheerioRequest(url).then((pg) => {
                        this.getVersionsFromPage(pg).then(callback);
                    })
                }else{
                    this.getVersionsFromPage(page).then(callback);
                }
            }else{
                resolve(this.cachedItems[obj.cachedID].versions);
            }
        })
    },
    installMod(profile, mod, modpack) {
        return new Promise((resolve, reject) => {
            this.getDependencies(mod).then((dependencies) => {
                if(dependencies.length >= 1) {
                    for(let depend of dependencies) {
                        this.installMod(profile, depend, modpack);
                    }
                }

                HTTPRequest.cheerioRequest(`https://minecraft.curseforge.com/projects/${mod.hosts.curse.id}/files`).then((page) => {
                    this.getVersionsForMCVersion(mod, profile.minecraftversion, page).then((versions) => {
                        if(versions.length !== 0) {
                            mod.version = versions[0].name;
                            mod.minecraftversion = profile.minecraftversion;
                            DownloadsManager.startModDownload(profile, mod, versions[0].downloadLink, modpack).then(() => {
                                mod.jar = `${Global.createID(mod.name)}.jar`;
                                profile.addMod(mod);
                                resolve();
                            });
                        }else{
                            reject('invalidVersion');
                        }
                    })
                })

            });
        })
    },
    installModVersion(profile, mod, version, dependencies) {
        return new Promise((resolve) => {
            if(!dependencies) {
                this.getFileInfo(mod, version).then((mod) => {
                    DownloadsManager.startModDownload(profile, mod, `https://minecraft.curseforge.com/projects/${mod.hosts.curse.id}/files/${version}/download`, false).then(() => {
                        mod.jar = `${Global.createID(mod.name)}.jar`;
                        mod.id = `${Global.createID(mod.name)}`;
                        resolve(mod);
                    })
                })
            }
        })
    },
    getIsPackFTB(pack) {
        return new Promise((resolve) => {
            HTTPRequest.cheerioRequest(`https://minecraft.curseforge.com/projects/${pack.hosts.curse.id}`).then((page) => {
                const checker = page('.nav-support-permissions')[0];
                console.log(checker);
                if(checker) {
                    resolve(true);
                }else{
                    resolve(false);
                }
            })
        });
    },
    downloadModList(profile, list, callback, onUpdate, concurrent) {
        if(concurrent !== 0 && concurrent !== undefined) {
            for(let i = 0; i < concurrent - 1; i++) {
                this.downloadModList(profile, list, callback, onUpdate);
            }
        }
        if(list.length === 0) {
            callback();
        }else{
            let item = list[0];
            if(this.concurrentDownloads.includes(item)) {
                const list2 = list.slice();
                list2.shift();
                this.downloadModList(profile, list2, callback, onUpdate);
            }else{
                this.concurrentDownloads.push(item);
                this.installModVersion(profile, item, item.hosts.curse.fileID, false).then((modres) => {
                    profile.addMod(modres);
                    onUpdate(list.length);
                    list.shift();
                    this.downloadModList(profile, list, callback, onUpdate)
                })
            }
        }
    },
    installModpack(modpack) {
        return new Promise((resolve) => {
            if(!fs.existsSync(Global.MCM_TEMP)) {
                fs.mkdirSync(Global.MCM_TEMP);
            }
            let infoDownload = path.join(Global.MCM_TEMP, `${modpack.id}-install.zip`);

            this.getIsPackFTB(modpack).then((isFTB) => {
                const infoURL = isFTB ? `https://www.feed-the-beast.com/projects/${modpack.hosts.curse.id}/files/latest` : `https://minecraft.curseforge.com/projects/${modpack.hosts.curse.id}/files/latest`
                console.log(infoURL);
                DownloadsManager.startFileDownload(`Info for ${modpack.name}`, infoURL, infoDownload).then(() => {
                    let zip = new admzip(infoDownload);
    
                    let extractPath = path.join(Global.MCM_TEMP, `${modpack.id}-install/`);
                    zip.extractAllTo(extractPath, false);
                    fs.unlinkSync(infoDownload);
                    let manifest = JSON.parse(fs.readFileSync(path.join(extractPath, 'manifest.json')));
    
                    ProfilesManager.createProfile(manifest.name, manifest.minecraft.version).then((profile) => {
                        profile.setHostId('curse', modpack.hosts.curse.id);
                        profile.setVersion(manifest.version);
                        profile.changeMCVersion(manifest.minecraft.version);
                        profile.setForgeInstalled(true);
                        profile.setForgeVersion(`${manifest.minecraft.version}-${manifest.minecraft.modLoaders[0].id.substring(6)}`);
    
                        const list = manifest.files.map((file) => {
                            const mod = new Mod({
                                hosts: {
                                    curse: {
                                        id: file.projectID,
                                        fileID: file.fileID
                                    }
                                },
                                cachedID: `mod-install-${file.projectID}`
                            });
                            this.cachedItems[mod.cachedID] = mod;
                            return mod;
                        })
    
                        DownloadsManager.createProgressiveDownload(`Curse mods from ${profile.name}`).then((download) => {
                            let numberDownloaded = 0;
                            const concurrent = manifest.files.length >=5 ? 5 : 0;
                            this.downloadModList(profile, list, () => {
                                if(numberDownloaded === manifest.files.length) {
                                    DownloadsManager.removeDownload(download.name);
                                    let overridesFolder = path.join(extractPath, '/overrides');
                                    if(fs.existsSync(overridesFolder)) {
                                        console.log('overrides folder exists');
                                        fs.readdirSync(overridesFolder).forEach((file) => {
                                            if(file === 'mods') {
                                                fs.readdirSync(path.join(overridesFolder, file)).forEach((f) => {
                                                    Global.copyDirSync(path.join(overridesFolder, file, f), path.join(profile.gameDir, file, f));
                                                })
                                            }else{
                                                Global.copyDirSync(path.join(overridesFolder, file), path.join(profile.gameDir, file));
                                            }
                                        })
                                    }
    
                                    ForgeManager.setupForge(profile).then(() => {
                                        rimraf.sync(extractPath);
                                        profile.hosts = {
                                            curse: {
                                                id: modpack.hosts.curse.id
                                            }
                                        };
                                        profile.save();
                                        resolve();
                                    })
                                }
                            }, () => {
                                numberDownloaded++;
                                DownloadsManager.setDownloadProgress(download.name, Math.ceil((numberDownloaded/manifest.files.length) * 100));
                            }, concurrent);
                        })
                    });
                })
            })
            
        })
    }
}

export default Curse;