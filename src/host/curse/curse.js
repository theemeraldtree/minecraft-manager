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
                page('.project-listing-row').each((i, el) => {
                    // This code is sloppy only because parsing some scraped HTML isn't neat and tidy
                    let data = el.children[1];
                    let details = el.children[3];
                    let name = details.children[1].children[1].children[1].children[0].data.trim();
                    let url = `https://www.curseforge.com${details.children[1].children[1].attribs.href}`;
                    let blurb = details.children[5].children[0].data.trim();
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
        if(type === 'modpack') {
            return 'modpacks'
        }else if(type === 'mods') {
            return 'mc-mods';
        }else {
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
    getInfo(obj, tries) {
        return new Promise((resolve, reject) => {
            if(!this.cachedItems[obj.cachedID].detailedInfo) {
                let type;
                if(obj instanceof Mod) {
                    type = 'mc-mods';
                }else if(obj instanceof Profile) {
                    type = 'modpacks';
                }
                HTTPRequest.cheerioRequest(`https://curseforge.com/minecraft/${type}/${obj.hosts.curse.id}`).then((page) => {
                    obj.description = page('.project-detail__content').html();
                    obj.name = page('.font-bold')[0].children[0].data.trim();   
                    obj.hosts.curse.iconURL = page('.project-avatar')[0].children[1].children[1].attribs.src;
                    obj.detailedInfo = true;

                    let latestVerEl = page('.p-1')[0];
                    obj.latestVersion = {
                        name: latestVerEl.children[3].children[1].children[0].data,
                        downloadLink: `https://curseforge.com/minecraft/${type}/${obj.hosts.curse.id}/download/${latestVerEl.children[3].children[1].attribs.href.split('/')[5]}/file`
                    };
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
                let type;
                if(obj instanceof Mod) {
                    type = 'mc-mods';
                }
                HTTPRequest.cheerioRequest(`https://curseforge.com/minecraft/${type}/${obj.hosts.curse.id}/files/${file}`).then((page) => {
                    obj.name = page('.font-bold')[0].children[0].data.trim();   
                    obj.version = page('.text-primary-500')[2].data;
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
                    url = `https://curseforge.com/minecraft/mc-mods/${obj.hosts.curse.id}/relations/dependencies?filter-related-dependencies=3`
                }else if(obj instanceof Profile) {
                    url = `https://curseforge.com/minecraft/modpacks/${obj.hosts.curse.id}/relations/dependencies?filter-related-dependencies=6`
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

    getVersionsFromURL(url, type) {
        return new Promise((resolve) => {
            HTTPRequest.cheerioRequest(url).then(page => {
                this.getVersionsFromPage(page, type).then(versions => {
                    resolve(versions);
                });
            })
        })
    },
    getVersionsFromPage(page, type) {
        let list = [];
        return new Promise((resolve) => {
            for(let el of page('.listing-project-file')[0].children[3].children) {
                if(el.data !== ' ') {
                    let name;
                    if(type === 'modpack') {
                        name = el.children[3].children[1].children[0].data;
                    }else if(type === 'mod') {
                        name = el.children[3].children[1].children[0].data;
                    }
                    let downloadLink = `https://www.curseforge.com${el.children[13].children[1].children[1].attribs.href}/file`;

                    list.push({name: name, downloadLink: downloadLink});
                }
            }
            resolve(list);
        })
    },
    getVersionsForMCVersion(obj, mcversion, page) {
        return new Promise((resolve) => {
            if(!this.cachedItems[obj.cachedID].versions || obj.minecraftversion !== mcversion) {
                let url;
                let type;
                if(obj instanceof Mod) {
                    type = 'mod';
                    url = `https://www.curseforge.com/minecraft/mc-mods/${obj.hosts.curse.id}/files/all?filter-game-version=2020709689%3A${this.getCurseVersionForMCVersion(mcversion)}`
                }

                const callback = (list) => {
                    this.cachedItems[obj.cachedID].versions = list;
                    resolve(list);
                };

                if(!page) {    
                    HTTPRequest.cheerioRequest(url).then((pg) => {
                        this.getVersionsFromPage(pg, type).then(callback);
                    })
                }else{
                    this.getVersionsFromPage(page, type).then(callback);
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

                HTTPRequest.cheerioRequest(`https://curseforge.com/minecraft/mc-mods/${mod.hosts.curse.id}/files/all?filter-game-version=2020709689%3A${Curse.getCurseVersionForMCVersion(profile.minecraftversion)}`).then((page) => {
                    this.getVersionsForMCVersion(mod, profile.minecraftversion, page).then((versions) => {
                        if(versions.length !== 0) {
                            mod.version = versions[0].name;
                            mod.minecraftversion = profile.minecraftversion;
                            
                            const downloadLink = versions[0].downloadLink;
                            const fileID = downloadLink.split('/')[7];
                            mod.hosts.curse.fileID = fileID;
                            mod.hosts.curse.downloadLink = downloadLink;
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
                    DownloadsManager.startModDownload(profile, mod, `https://curseforge.com/minecraft/mc-mods/${mod.hosts.curse.id}/download/${version}/file`, false).then(() => {
                        mod.jar = `${Global.createID(mod.name)}.jar`;
                        mod.id = `${Global.createID(mod.name)}`;
                        resolve(mod);
                    })
                })
            }
        })
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
                HTTPRequest.cheerioRequest(`https://curseforge.com/projects/${item.hosts.curse.id}`).then((page) => {
                    const curseRealID = page('.project-avatar')[0].children[1].attribs.href.split('/')[3];
                    item.hosts.curse.id = curseRealID;
                    this.installModVersion(profile, item, item.hosts.curse.fileID, false).then((modres) => {
                        if(!profile.mods.find(item => (item.id === modres.id))) {
                            profile.addMod(modres);
                        }
                        onUpdate(list.length);
                        list.shift();
                        this.downloadModList(profile, list, callback, onUpdate)
                    })
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

            ProfilesManager.profilesBeingInstalled.push(modpack.id);
            this.getInfo(modpack).then((modpack) => {
                DownloadsManager.startFileDownload(`Info for ${modpack.name}`, modpack.latestVersion.downloadLink, infoDownload).then(() => {
                    let zip = new admzip(infoDownload);
    
                    let extractPath = path.join(Global.MCM_TEMP, `${modpack.id}-install/`);
                    zip.extractAllTo(extractPath, false);
                    fs.unlinkSync(infoDownload);
                    let manifest = JSON.parse(fs.readFileSync(path.join(extractPath, 'manifest.json')));
    
                    ProfilesManager.createProfile(modpack.name, manifest.minecraft.version).then((profile) => {
                        profile.hosts = modpack.hosts;
                        profile.hosts.curse.fullyInstalled = false;
                        profile.setProfileVersion(manifest.version);
                        profile.changeMCVersion(manifest.minecraft.version);
                        profile.setForgeInstalled(true);
                        profile.setForgeVersion(`${manifest.minecraft.version}-${manifest.minecraft.modLoaders[0].id.substring(6)}`);
                        
                        profile.save();
                        profile.setCurrentState('installing');

                        ProfilesManager.updateProfile(profile);

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
                                        DownloadsManager.startFileDownload(`Icon for ${profile.name}`, modpack.hosts.curse.iconURL, path.join(profile.folderpath, '/icon.png')).then(() => {
                                            rimraf.sync(extractPath);
                                            profile.hosts.curse.fullyInstalled = true;
                                            profile.save();
                                            ProfilesManager.profilesBeingInstalled.splice(ProfilesManager.profilesBeingInstalled.indexOf(modpack.id), 1);
                                            resolve();
                                        })
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
    },
    getVersionsFromItem(item, type) {
        return new Promise((resolve) => {
            console.log(`https://curseforge.com/minecraft/${type}/${item.hosts.curse.id}/files`);
            this.getVersionsFromURL(`https://curseforge.com/minecraft/${this.getCurseType(type)}/${item.hosts.curse.id}/files`, type).then(versions => {
                resolve(versions);
            })
        })
    }
}

export default Curse;