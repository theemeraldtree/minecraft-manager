import FileUtils from '../util/fileUtils';
import MinecraftVersionManager from './minecraftVersionManager';
import Mod from '../util/mod';
import Data from '../util/data';
import CurseModpack from '../util/curseModpack';
const fs = require('fs');
const path = require('path');
const https = require('follow-redirects').https;
const zipper = require('adm-zip');
const rimraf = require('rimraf');
const cheerio = require('cheerio');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(fs);
class CurseManager {
    constructor() {
        this.profiles = [];
    }

    scrapeCurseModList = (url, type) => {
        return new Promise((resolve) => {
            https.get(url, (resp) => {
                var bodyChunks = [];
                resp.on('data', (chunk) => {
                    bodyChunks.push(chunk);
                });

                resp.on('end', () => {
                    var body = Buffer.concat(bodyChunks);
                    let page = cheerio.load(body);

                    let listingElements = page('.listing-project').toArray();
                    if(listingElements[0]) {
                        let elementList = listingElements[0].children;

                        let res = [];

                        for(var i = 0; i < elementList.length; i++) {
                            if(elementList[i].name === 'li') {
                                let item = elementList[i];
                                console.log(item);
                                let div = item.children[1];

                                let link = div.children[3].children[1];
                                let urlFull = link.attribs.href;

                                console.log(urlFull);
                                let img = div.children[1].children[1].children[1].children[1].attribs.src;
                                if(img === undefined) {
                                    img = 'https://www.curseforge.com/Content/2-0-6638-22985/Skins/CurseForge/images/anvilBlack.png';
                                }else{
                                    img = this.getFullImage(img);
                                }
                                let desc = div.children[3].children[5].children[1].attribs.title;
                                let url = urlFull;
                                if(type === 'mod') {
                                    url = urlFull.substring(10);
                                }else if(type === 'modpack'){
                                    url = urlFull.substring(11);
                                }else{
                                    url = urlFull.substring(10);
                                }

                                console.log(url);
                                let id = url.substring(9);
                                console.log('id: ' + id);

                                let name = link.children[1].children[0].data.replace(/\s+/g, ' ').trim();
                                
                                let out;
                                if(type === 'mod') {
                                    out = new Mod({id: Data.createId(name), icon: img, description: desc, name: name, type: 'curse', curseID: id});
                                }else if(type === 'modpack') {
                                    out = new CurseModpack({id: Data.createId(name), icon: img, description: desc, name: name, curseID: id})
                                }
                                res.push(out);                               
                            }
                        }

                        resolve(res);
                    }else{
                        resolve([]);
                    }
                })
            })
        })
    }

    getIsPackFTB = (packID) => {
        console.log(`https://minecraft.curseforge.com/projects/${packID}`);
        return new Promise((resolve) => {
            https.get(`https://minecraft.curseforge.com/projects/${packID}`, (resp) => {
                let bodyChunks = [];
                resp.on('data', (chunk) => {
                    bodyChunks.push(chunk);
                })
                resp.on('end', () => {
                    console.log('end');
                    let isFTB = resp.responseUrl.substring(12, 26) === 'feed-the-beast';
                    console.log(resp.responseUrl);
                    resolve(isFTB);
                })
            });
        })

    }

    getTopMods = () => {
        return new Promise((resolve) => {
            this.scrapeCurseModList('https://www.curseforge.com/minecraft/mc-mods', 'mod').then((res) => {
                resolve(res);
            })
        });
    }

    getTopModpacks = () => {
        return new Promise((resolve) => {
            this.scrapeCurseModList(`https://www.curseforge.com/minecraft/modpacks`, 'modpack').then((res) => {
                console.log(res);
                resolve(res);
            })
        })
    }

    getLatestCurseFile = (mod, mcver) => {
        return new Promise((resolve, reject) => {
            https.get(`https://minecraft.curseforge.com/projects/${mod.curseID}/files?filter-game-version=2020709689:${this.getCurseVersionId(mcver)}`, (resp) => {
                let bodyChunks = [];
                resp.on('data', (chunk) => {
                    bodyChunks.push(chunk);
                });

                resp.on('end', () => {
                    const body = Buffer.concat(bodyChunks);
                    const page = cheerio.load(body);

                    const list = page('.project-file-list-item').toArray();
                    if(list[0]) {
                        let downloadUrl = list[0].children[3].children[1].children[1].children[1].attribs.href;
                        resolve(downloadUrl.substring(downloadUrl.length - 16, downloadUrl.length - 9));
                    }else{
                        reject('no-mcversion');
                    }
                })
            })
        })
    }

    getFileInfo = (mod, file) => {
        console.log('getting info for file:' + file);
        console.log(mod);
        return new Promise((resolve) => {
            let url;
            if(mod.isFTB) {
                url = `https://www.feed-the-beast.com/projects/${mod.curseID}/files/${file}`
            }else{
                url = `https://minecraft.curseforge.com/projects/${mod.curseID}/files/${file}`
            }
            https.get(url, (resp) => {
                let bodyChunks = [];
                resp.on('data', (chunk) => {
                    bodyChunks.push(chunk);
                });

                resp.on('end', () => {
                    const body = Buffer.concat(bodyChunks);
                    const page = cheerio.load(body);

                    const date = page('.standard-datetime').toArray();
                    let info = {};
                    info['date-epoch'] = date[0].attribs['data-epoch'];
                    info['fileName'] = page('.details-header').toArray()[0].children[3].children[0].data.replace(/\.[^/.]+$/, "");
                    resolve(info);
                })
            })
        })
    }

    downloadCurseFile = (fileUrl, targetPath, callback) => {
        var file = fs.createWriteStream(targetPath);
        console.log('download curse file start');
        https.get(fileUrl, (response) => {
            response.pipe(file);
            file.on('finish', ()=> {
                console.log('download finish?'); 
                file.end();
                callback();
            })
        }).on('error', () => {
            console.log('error :(');
            this.downloadCurseFile(fileUrl, targetPath, callback);            
        });
    }
    downloadDependencies = (mod, profile) => {
        return new Promise((resolve) => {
            https.get(`https://minecraft.curseforge.com/projects/${mod.curseID}/relations/dependencies?filter-related-dependencies=3`, (resp) => {
                var bodyChunks = [];
                resp.on('data', (chunk) => {
                    bodyChunks.push(chunk);
                })
                resp.on('end', () => {
                    var body = Buffer.concat(bodyChunks);
                    var page = cheerio.load(body);
                    var list = page(".project-list-item").toArray();
                    if(list.length == 0) {
                        resolve();
                    }else{
                        for(var i = 0; i < list.length;i++) {
                            if(list[i].name === "li") {
                                var link = list[i].children[1].children[1];
                                var urlFull = link.attribs.href;
        
                                if(urlFull.substring(0, 10) == "/projects/") {                        
                                    var id = urlFull.substring(10);
                                            
                                    let img = list[i].children[1].children[1].children[1].attribs.src;
                                    if(img === undefined) {
                                        img = 'https://www.curseforge.com/Content/2-0-6638-22985/Skins/CurseForge/images/anvilBlack.png';
                                    }else{
                                        // get full image icon
                                        img = this.getFullImage(img);
                                    }

                                    
                                    let desc = list[i].children[3].children[5].children[1].children[0].data;
                                    let modName = list[i].children[3].children[1].children[1].children[1].children[0].data;
                                    let newMod = new Mod({icon: img, type: 'curse', description: desc, name: modName, id: id, curseID: id})
    
                                    profile.installMod(newMod, () => {

                                    }, {"ignore-invalid-mcversion": true}).then(() => {
                                        if(i === list.length) {
                                            resolve();
                                        }
                                    });
                                }
                            }
                        }
                    }
    
                });
            });
        })
    }
    getFullImage = (img) => {
        let lastslash = img.lastIndexOf('/');
        console.log(lastslash);
        console.log(img.substring(lastslash + 1));
        let imgname = img.substring(lastslash + 1);
        let imgpath = img.substring(46, 54);
        console.log(imgpath);
        let sections = img.split('/');
        console.log(sections);
        let newimg = `https://media.forgecdn.net/avatars/${sections[5]}/${sections[6]}/${imgname}`;
        return newimg;
    }
    downloadModFileToLocation = (mod, file, loc) => {
        return new Promise((resolve) => {
            this.downloadCurseFile(`https://minecraft.curseforge.com/projects/${mod.curseID}/files/${file}/download`, loc, () => {
                resolve();
            });
        })
    }
    getDetailedModInfo = (mod, doMCVersions) => {
        let curseID;
        if(mod instanceof Object) {
            curseID = mod.curseID;
        }else{
            curseID = mod;
        }
        console.log('gathering detailed mod info for mod with curse id: ' + curseID);
        return new Promise((resolve) => {
            https.get(`https://minecraft.curseforge.com/projects/${curseID}`, (resp) => {
                let isFTB = resp.responseUrl.substring(12, 26) === 'feed-the-beast';
                var bodyChunks = [];
                resp.on("data", (chunk) => {
                    bodyChunks.push(chunk);
                });
    
                resp.on('end', () => {
                    const body = Buffer.concat(bodyChunks);
                    const page = cheerio.load(body);
    
                    var possibleVersions = [];
                    // Find the possible versions
    
                    var n = page(".project-description");

                    let details = page('.project-details-container').toArray()[0];
                    let detailedInfo = {};
                    detailedInfo.curseDescription = n.html();
                    var completed = 0;
    
                    const mcVersions = MinecraftVersionManager.getVersions();

                    let metatags = page('meta').toArray();
                    for(let metatag of metatags) {
                        if(metatag.attribs.property === 'og:description') {
                            detailedInfo.desc = metatag.attribs.content;
                        }
                    }
                    detailedInfo.isFTB = isFTB;
                    let img;
                    if(details.children[1].children[1].children[1].children[1]) {
                        img = details.children[1].children[1].children[1].children[1].attribs.src;
                        img = this.getFullImage(img);
                    }else{
                        img = '';
                    }
                    detailedInfo.icon = img;
                    detailedInfo.name = details.children[1].children[3].children[1].children[1].children[0].data;
                    if(doMCVersions) {
                        for(var i = 0; i < mcVersions.length; i++) {
                            const ver = mcVersions[i];
                            
                            console.log('checking ver: ' + ver);
                            let url;
                            if(isFTB) {
                                url = `https://www.feed-the-beast.com/projects/${curseID}/files?filter-game-version=2020709689:${this.getCurseVersionId(ver)}`
                            }else{
                                url = `https://minecraft.curseforge.com/projects/${curseID}/files?filter-game-version=2020709689:${this.getCurseVersionId(ver)}`
                            }
                            console.log(url);
                            https.get(url, (resp) => {
                                var bodyChunks = [];
                                resp.on('data', (chunk) => {
                                    bodyChunks.push(chunk);
                                })
                                resp.on('end', () => {
                                    var body = Buffer.concat(bodyChunks);
                                    var page = cheerio.load(body);
                                    var list = page(".project-file-list-item").toArray();
        
                                    if(list.length !== 0) {
                                        possibleVersions[mcVersions.indexOf(ver)] = ver;
                                    }
        
                                    completed++;
                                    
                                    if(completed === mcVersions.length) {
                                        possibleVersions = possibleVersions.filter(n => n);
                                        detailedInfo["mcVersions"] = possibleVersions;
                                        resolve(detailedInfo);
                                    }
                                });
                            })
                        }
                    }else{
                        resolve(detailedInfo);
                    }
                })
            })
        });
    }

    getCurseVersionId = (ver) => {
        var versions = {
            "1.12.2": "6756",
            "1.12.1": "6711",
            "1.12": "6580",
            "1.11.2": "6452",
            "1.11": "6317",
            "1.10.2": "6170",
            "1.9.4": "6084",
            "1.9": "5946",            
            "1.8.9": "5806",
            "1.8.8": "5703",
            "1.8": "4455",
            "1.7.10": "4449"
        }

        return versions[ver];
    }

    getModSearchResults = (search) => {
       return new Promise((resolve) => {
           this.scrapeCurseModList(`https://www.curseforge.com/minecraft/mc-mods/search?search=${search}`, 'mod').then((res) => {
               resolve(res);
           })
       }) 
    }

    getModpackSearchResults = (search) => {
        return new Promise((resolve) => {
            this.scrapeCurseModList(`https://www.curseforge.com/minecraft/modpacks/search?search=${search}`, 'modpack').then((res) => {
                resolve(res);
            })
        })
    }
    scrapeModFiles = (url, finish, out) => {
        console.log('scrape: ' + url);
        https.get(url, (resp) => {
            let bodyChunks = [];
            resp.on('data', (chunk) => {
                bodyChunks.push(chunk);
            });

            resp.on('end', () => {
                const body = Buffer.concat(bodyChunks);
                const page = cheerio.load(body);

                const list = page('.project-file-list-item').toArray();
                for(let item of list) {
                    console.log(item);
                    let name = item.children[3].children[1].children[3].children[1].children[0].data.replace(/\s+/g, ' ').trim();
                    let downloadUrl = item.children[3].children[1].children[1].children[1].attribs.href;
                    let fileID = downloadUrl.substring(downloadUrl.length-16,downloadUrl.length-9);
                    out.push({name: name, downloadURL: downloadUrl, fileID: fileID});
                }

                let paginationItems = page('.b-pagination-item').toArray();

                let amount = 0;
                let nextURL;
                for(let pagItem of paginationItems) {
                    if(pagItem.children[0]) {
                        if(pagItem.children[0].attribs) {
                            if(pagItem.children[0].attribs['rel'] === 'next') {
                                let newURL = pagItem.children[0].attribs['href'];
                                if(newURL) {
                                    amount += 1;
                                    nextURL = newURL;
                                }
                            }
                        }

                    }
                }
                console.log(amount);
                if(amount >= 1) {
                    this.scrapeModFiles(`https://minecraft.curseforge.com${nextURL}`, finish, out);
                }else{
                    finish(out);
                }
            })
        })
    }
    scrapePackFiles = (url, finish, out, isFTB) => {
        https.get(url, (resp) => {
            let bodyChunks = [];
            resp.on('data', (chunk) => {
                bodyChunks.push(chunk);
            });

            resp.on('end', () => {
                const body = Buffer.concat(bodyChunks);
                const page = cheerio.load(body);

                const list = page('.project-file-list-item').toArray();
                for(let item of list) {
                    console.log(item.children[3].children[1].children[1].children[1].children[0].data);
                    let name = item.children[3].children[1].children[1].children[1].children[0].data.replace(/\s+/g, ' ').trim();
                    let downloadUrl = item.children[3].children[1].children[1].children[1].attribs.href;
                    console.log(downloadUrl);
                    let fileID = downloadUrl.substring(downloadUrl.length-7);
                    
                    out.push({name: name, downloadURL: downloadUrl, fileID: fileID});
                }

                let paginationItems = page('.b-pagination-item').toArray();

                let amount = 0;
                let nextURL;
                for(let pagItem of paginationItems) {
                    if(pagItem.children[0]) {
                        if(pagItem.children[0].attribs) {
                            if(pagItem.children[0].attribs['rel'] === 'next') {
                                let newURL = pagItem.children[0].attribs['href'];
                                if(newURL) {
                                    amount += 1;
                                    nextURL = newURL;
                                }
                            }
                        }

                    }
                }
                console.log(amount);
                if(amount >= 1) {
                    let urltogo;
                    if(isFTB) {
                        urltogo = `https://www.feed-the-beast.com${nextURL}`
                    }else{
                        urltogo = `https://minecraft.curseforge.com${nextURL}`
                    }
                    this.scrapePackFiles(urltogo, finish, out, isFTB);
                }else{
                    finish(out);
                }
            })
        })
    }
    getModFiles = (mod, mcver) => {
        return new Promise((resolve) => {
            this.scrapeModFiles(`https://minecraft.curseforge.com/projects/${mod.curseID}/files?filter-game-version=2020709689:${this.getCurseVersionId(mcver)}`, (res) => {
                console.log(res);
                resolve(res);
            }, []);
        })
    }

    getPackFiles = (pack, mcver) => {
        console.log('get pack files');
        console.log(mcver);
        return new Promise((resolve) => {
            let url;
            if(pack.isFTB) {
                url = `https://www.feed-the-beast.com/projects/${pack.curseID}/files?filter-game-version=2020709689:${this.getCurseVersionId(mcver)}`;
            }else{
                url = `https://minecraft.curseforge.com/projects/${pack.curseID}/files?filter-game-version=2020709689:${this.getCurseVersionId(mcver)}`;
            }

            this.scrapePackFiles(url, (res) => {
                console.log(res);
                resolve(res);
            }, [])
        })
    }

    installPackVersion = (pack, file, update) => {
        return new Promise((resolve, reject) => {
            
            if(fs.existsSync(path.join(FileUtils.getAppPath(), `/temp/packinstall-${pack.id}`))) {
                rimraf.sync(path.join(FileUtils.getAppPath(), `/temp/packinstall-${pack.id}`));
            }

            FileUtils.createDirIfNonexistent(path.join(FileUtils.getAppPath(), `/temp`));

            // console.log(`get ${pack.icon}`)
            // let iconFile = fs.createWriteStream(path.join(FileUtils.getAppPath(), `/profiles/${pack.id}/icon.png`));
            // https.get(pack.icon, (resp) => {
            //     resp.pipe(iconFile);
            // });
            //pack.icon = path.join(FileUtils.getAppPath(), `/profiles/${pack.id}/icon.png`);
            update('Checking for FTB pack...');
            this.getIsPackFTB(pack.curseID).then((isFTB) => {
                pack.isFTB = isFTB;
                console.log('isftb: ' + isFTB);
                update('Downloading zip...');
                this.downloadPackVersion(pack, file).then(() => {
                    update('Unzipping...');
                    let zip = new zipper(path.join(FileUtils.getAppPath(), `/temp/packdownload-${pack.id}.zip`));
    
                    zip.extractAllToAsync(path.join(FileUtils.getAppPath(), `/temp/packinstall-${pack.id}`), false, (err) => {
                        if(err) {
                            reject(err);
                        }else{
                            update('Importing modpack...');
                            this.importCurseModpack(pack, path.join(FileUtils.getAppPath(), `/temp/packinstall-${pack.id}`), (upd) => {
                                update(upd);
                            }, file).then(() => {
                                console.log('resolve???');
                                resolve();
                            })
                        }
                    })
                })
            })
            
        })
    }
    downloadPackVersion = (pack, file) => {
        return new Promise((resolve) => {
            let curseID = pack.curseID;
            rimraf.sync(path.join(FileUtils.getAppPath(), '/temp'))
            fs.mkdirSync(path.join(FileUtils.getAppPath(), `/temp`));
            let url;
            if(pack.isFTB) {
                url = `https://feed-the-beast.com/projects/${curseID}/files/${file}${file !== 'latest' ? '/download' : ''}`;
            }else{
                url = `https://minecraft.curseforge.com/projects/${curseID}/files/${file}${file !== 'latest' ? '/download' : ''}`;
            }
            console.log(url);
            this.downloadCurseFile(url, path.join(FileUtils.getAppPath(), `/temp/packdownload-${pack.id}.zip`), () => {
                resolve();
            })
        })
    }

    downloadModpackFile = (profile, mod, finish, iteration) => {
        // Gets mods data
        console.log('initializing download for ' + mod.projectID);
        https.get(`https://minecraft.curseforge.com/projects/${mod.projectID}`, (res) => {
            let bodyChunks = [];
            res.on('data', (chunk) => {
                bodyChunks.push(chunk);
            });

            res.on('end', () => {
                this.getDetailedModInfo(mod.projectID, false).then((detailedInfo) => {
                    console.log(profile.mods);
                    let modObj = new Mod({id: Data.createId(detailedInfo.name), name: detailedInfo.name, description: detailedInfo.desc, icon: detailedInfo.icon, curseID: mod.projectID, type: 'curse', curseFileId: mod.fileID});
                    profile.mods.push(modObj);
                    this.downloadModFileToLocation(modObj, mod.fileID, path.join(FileUtils.getAppPath(), `/profiles/${profile.id}/files/mods/${modObj.id}.jar`)).then(() => {
                        finish();
                    });
                })
            })
            
        }).on('error', () => {

            if(iteration === 3) {
                console.error('ERROR INSTALLING MOD: ' + mod.projectID + '. 3 Tries attempted, no luck')
            }else{
                console.error('Error installing mod: ' + mod.projectID + 'Attempting try ' + iteration + ' / 3');
                this.downloadModpackFile(profile, mod, finish, iteration + 1)
            }
        })
    }

    downloadModpackMods = (profile, mods, update) => {
        profile.downloadStatus = 0;
        return new Promise((resolve) => {
            for(let mod of mods) {
                this.downloadModpackFile(profile, mod, () => {
                    profile.downloadStatus += 1;
                    update(`Downloading: ${profile.downloadStatus} / ${mods.length}`);
                    if(profile.downloadStatus === mods.length) {
                        resolve();
                    }
                }, 0)
            }
        })
        
    }
    importCurseModpack = (profile, dir, statusUpdate, file) => {
        return new Promise((resolve) => {
            statusUpdate('Reading manifest...');
            let manifest = JSON.parse(fs.readFileSync(path.join(dir, '/manifest.json')));
            this.downloadModpackMods(profile, manifest.files, statusUpdate).then(() => {
                statusUpdate('Setting profile properties...');
                this.getFileInfo(profile, file).then((fileInfo) => {
                    profile.epochDate = fileInfo['date-epoch'];
                    profile.version = manifest.version;
                    profile.mcVersion = manifest.minecraft.version;
                    profile.curseFileID = file;
                    profile.versionname = Data.createVersionName(profile.name);
                    statusUpdate('Copying overrides...');
                    fs.readdir(path.join(FileUtils.getAppPath(), `/temp/packinstall-${profile.id}/overrides`), (err, files) => {
                        console.log(files);
                        for(let file of files) {
                            let filepath = path.join(FileUtils.getAppPath(), `/temp/packinstall-${profile.id}/overrides/${file}`);
                            FileUtils.copy(filepath, path.join(FileUtils.getAppPath(), `/profiles/${profile.id}/files/${file}`));
                        }
                        statusUpdate('Installing forge...');
                        let rawForge = manifest.minecraft.modLoaders[0].id.substring(manifest.minecraft.modLoaders[0].id.indexOf('forge') + 6)
                        profile.installForgeVersion(`${profile.mcVersion}-${rawForge}`, (update) => {
                            statusUpdate(update);
                        }).then(() => {
                            profile.rawForge = rawForge;
                            profile.forgeMCVer = profile.mcVersion;
                            profile.forgeVersion = profile.forgeVersion.substring(profile.forgeVersion.indexOf('forge') + 6);
                            profile.save();
                            resolve();
                        });
                    })
                })
            })
        })
    }
    getModpackLatestFile = (pack) => {
        return new Promise((resolve, reject) => {
            let curseID = pack.curseID;
            console.log(pack.isFTB);
            let url;
            if(pack.isFTB) {
                url = `https://www.feed-the-beast.com/projects/${curseID}/files`
            }else{
                url = `https://minecraft.curseforge.com/projects/${curseID}/files`;
            }
            https.get(url, (resp) => {
                let bodyChunks = [];
                resp.on('data', (chunk) => {
                    bodyChunks.push(chunk);
                });

                resp.on('end', () => {
                    const body = Buffer.concat(bodyChunks);
                    const page = cheerio.load(body);

                    const list = page('.project-file-list-item').toArray();
                    if(list[0] == null) {
                        reject('CM-MPLF-1000');
                    }else{
                        console.log(list[0]);
                        let url = list[0].children[3].children[1].children[1].children[1].attribs.href;
                        let fileID = url.substring(url.length - 7);
                        let epochDate = list[0].children[7].children[1].attribs['data-epoch'];
    
                        let zipFileName = list[0].children[3].children[1].children[1].children[1].children[0].data;
                        let fileName;
                        if(zipFileName.substring(zipFileName.length - 4) === '.zip') {
                            fileName = zipFileName.substring(0, zipFileName.length - 4);
                        }else{
                            fileName = zipFileName;
                        }
                        let res = {};
                        console.log(fileName);
                        res['epochDate'] = epochDate;
                        res['fileID'] = fileID;
                        res['verName'] = fileName;
                        resolve(res);
                    }

                })
            })
        })
    } 
}

export default new CurseManager();