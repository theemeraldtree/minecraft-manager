// THIS IS BEING DEPRECATED
// everything is moving to curseRework.js
// this file will eventually be replaced by curserework,
// however it's here know just for backwards compat
import Profile from "../../type/profile";
import Global from "../../util/global";
import Mod from "../../type/mod";
import HTTPRequest from "../httprequest";
import DownloadsManager from "../../manager/downloadsManager";
import fs from 'fs';
import path from 'path';
import ProfilesManager from "../../manager/profilesManager";
import ForgeManager from "../../manager/forgeManager";
import rimraf from 'rimraf';
import ToastManager from "../../manager/toastManager";
const admzip = require('adm-zip');
let Curse = {
    cached: {
        popular: {

        },
        assets: {

        }
    },
    concurrentDownloads: [],
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
    sendCantConnect() {
        ToastManager.createToast('Whoops!', "Looks like we can't connect to Curse right now. Check your internet connection and try again.");
    },
    readCurseAssetList(list) {
        let finalList = [];
        for(let asset of list) {
            let type;
            switch(asset.categorySection.gameCategoryId) {
                case 4471:
                    type = 'profile';
                    break;
                case 6:
                    type = 'mod';
                    break;
                case 12:
                    type = 'resourcepack';
                    break;
                case 17:
                    type = 'world';
                    break;
            }

            let obj;


            const omaf = this.createObjectFromInfo(asset);

            if(type === 'profile') {
                obj = new Profile(omaf);
            }else if(type === 'mod') {
                obj = new Mod(omaf);
            }

            if(asset.attachments && asset.attachments.length) {
                let attach;
                for(let attachment of asset.attachments) {
                    if(attachment.isDefault) {
                        attach = attachment;
                    }
                }
                omaf.iconpath = attach.url;
                obj.iconpath = attach.url;
                omaf.iconURL = attach.url;
                obj.iconURL = attach.url;
            }

            Global.cacheImage(obj.iconURL);

            this.cached.assets[omaf.cachedID] = omaf;

            finalList.push(obj);
        }

        return finalList;
    },

    createObjectFromInfo(asset) {
        let authorsList = [];
        for(let author of asset.authors) {
            authorsList.push({
                name: author.name
            })
        }

        const obj =  {
            name: asset.name,
            id: Global.createID(asset.name),
            blurb: asset.summary,
            url: asset.websiteUrl,
            authors: authorsList,
            cachedID: `curse-cached-${Global.createID(asset.name)}`,
            type: this.getTypeFromID(asset.categorySection.gameCategoryId),
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
            let attach;
            for(let attachment of asset.attachments) {
                if(attachment.isDefault) {
                    attach = attachment;
                }
            }

            obj.iconURL = attach.url;
        }

        return obj;

    },

    getCurseTypeID(type) {
        if(type === 'profile' || type === 'modpack') {
            return 4471;
        }else if(type === 'mod') {
            return 6;
        }
    },

    getTypeFromID(id) {
        if(id === 4471) {
            return 'profile';
        }else if(id === 6) {
            return 'mod';
        }
    },

    async getFullAsset(asset, type) {
        const info = await this.getInfo(asset);
        
        let obj;
        if(type === 'mod') {
            obj = new Mod(this.createObjectFromInfo(info));
        }else if(type === 'unknown') {
            return this.createObjectFromInfo(info);
        }

        return obj;
    },

    async getInfo(asset) {
        return JSON.parse(await this.HTTPGet(`https://addons-ecs.forgesvc.net/api/v2/addon/${asset.hosts.curse.id}`));
    },

    async addDescription(asset) {
        if(this.cached.assets[asset.cachedID]) {
            if(!this.cached.assets[asset.cachedID].description) {
                const desc =  await this.getDescription(asset);
                asset.description = desc;
                if(desc) {
                    this.cached.assets[asset.cachedID] = asset;
                }
                return asset;
            }else{
                return this.cached.assets[asset.cachedID];
            }
        }else{ 
            asset.cachedID = `curse-cached-${Global.createID(asset.name)}`;
            this.cached.assets[asset.cachedID] = {};
            return await this.addDescription(asset);
        }
    },

    async getDescription(asset) {
        if(!this.cached.assets[asset.cachedID].description) {
            return await this.HTTPGet(`https://addons-ecs.forgesvc.net/api/v2/addon/${asset.hosts.curse.id}/description`, {
                addonID: asset.hosts.curse.id
            });
        }else{
            return this.cached.assets[asset.cachedID].description;
        }
    },

    async search(term, type) {
        const result = await this.HTTPGet(`https://addons-ecs.forgesvc.net/api/v2/addon/search`, {
            searchFilter: term.split(' ').join('%20'),
            gameId: 432,
            sectionId: Curse.getCurseTypeID(type),
            categoryId: 0,
            sort: 0,
            pageSize: 20,
            index: 0
        });

        if(result) {
            return this.readCurseAssetList(JSON.parse(result));
        }else{
            return undefined;
        }

    },

    async cacheCommon() {
        this.getPopularAssets('profile');
        this.getPopularAssets('mod');
    },

    async getPopularAssets(type) {
        let res;
        if(!this.cached.popular[type]) {
            res = await this.search('', type);
            if(res) {
                this.cached.popular[type] = res;
            }else{
                return undefined;
            }
        }else{
            res = this.cached.popular[type];
        }
        return res;
    },

    async addFileInfo(asset, fileID) {
        const info = await this.getFileInfo(asset, fileID);

        if(info) {
            asset.version = this.parseCurseVersion(info);
            asset.hosts.curse.fileID = fileID;
            asset.hosts.curse.fileName = info.fileName;
            asset.downloadTemp = info.downloadUrl;
            this.cached.assets[asset.cachedID] = asset;
    
            const dependFinal = [];
            if(info.dependencies) {
                for(let dependency of info.dependencies) {
                    if(dependency.type === 3) {
                        dependFinal.push({
                            hosts: {
                                curse: {
                                    id: dependency.addonId
                                }
                            }
                        })
                    }
                }
            }
    
            asset.dependencies = dependFinal;
            return asset;
        }else{
            return undefined;
        }

    },

    async getFileChangelog(asset, fileID) {
        return await this.HTTPGet(`https://addons-ecs.forgesvc.net/api/v2/addon/${asset.hosts.curse.id}/file/${fileID}/changelog`);
    },

    async getFileInfo(asset, fileID) {
        const res = await this.HTTPGet(`https://addons-ecs.forgesvc.net/api/v2/addon/${asset.hosts.curse.id}/file/${fileID}`);
        if(res) {
            return JSON.parse(res);
        }else{
            return undefined;
        }
    },

    async getDependencies(asset) {
        if(this.cached.assets[asset.cachedID]) {
            if(!this.cached.assets[asset.cachedID].dependencies) {
                let newAsset;
                if(!asset.installed) {
                    newAsset = await this.addFileInfo(asset, asset.hosts.curse.latestFileID);
                }else{
                    newAsset = await this.addFileInfo(asset, asset.hosts.curse.fileID);
                }

                if(newAsset) {
                    let final = [];
                    for(let depend of newAsset.dependencies) {
                        final.push(await this.getFullAsset(depend, 'unknown'));
                    }
                    this.cached.assets[asset.cachedID].dependencies = final;
                    return final;
                }else{
                    return undefined;
                }

            }else{
                const dependList = this.cached.assets[asset.cachedID].dependencies;
                if(dependList.length >= 1) {
                    if(!dependList[0].name) {
                        this.cached.assets[asset.cachedID].dependencies = undefined;
                        return await this.getDependencies(asset);
                    }
                }
                return this.cached.assets[asset.cachedID].dependencies;
            }
        }else{
            const newID = `curse-cached-${Global.createID(asset.name)}`;
            this.cached.assets[newID] = asset;
            asset.cachedID = newID;
            return await this.getDependencies(asset)
        }
    },

    // async getDependenciesFull(asset) {
    //     const dependencies = await this.getDependencies(asset);
    //     let final = [];
    //     for(let depend of dependencies) {
    //         final.push(await this.getFullAsset(dep))
    //     }
    // }
    async installDependencies(profile, asset) {
        if(asset.dependencies) {
            for(let depend of asset.dependencies) {
                if(depend.hosts.curse.fileID) {
                    this.installModVersionToProfile(profile, depend, depend.hosts.curse.fileID);
                }else{
                    this.installModToProfile(profile, depend);
                }
            }
        }
    },

    async getLatestVersionForMCVersion(asset, mcversion) {
        if(asset.hosts.curse.localValues && asset.hosts.curse.localValues.gameVerLatestFiles) { 
            for(let ver of asset.hosts.curse.localValues.gameVerLatestFiles) {
                if(ver.gameVersion === mcversion) {
                    return ver;
                }
            }
        }else{
            const fullAsset = await this.getFullAsset(asset, 'mod');
            const res = await this.getLatestVersionForMCVersion(fullAsset, mcversion);
            return res;
        }

        return undefined;
    },
    
    async installModToProfile(profile, mod) {
        return new Promise(async (resolve, reject) => {

            if(!mod.name) {
                mod = await this.getFullAsset(mod, 'mod');
            }

            const ver = await this.getLatestVersionForMCVersion(mod, profile.minecraftversion);
            if(!ver) {
                reject('no-version-available')
            }else{
                const newMod = await this.addFileInfo(mod, ver.projectFileId);
                await this.installModVersionToProfile(profile, newMod, true);
                resolve();
            }
        })
    },

    async installModVersionToProfile(profile, mod, dependencies) {
        return new Promise(async (resolve) => {
            if(!fs.existsSync(path.join(profile.gameDir, `/mods/${mod.id}.jar`))) {
                if(!mod.name) {
                    let newm = await this.getFullAsset(mod, 'mod');
                    newm.hosts.curse.fileID = mod.hosts.curse.fileID;
                    mod = newm;
                }
                DownloadsManager.createProgressiveDownload(`${mod.name}\n_A_`).then(async (download) => {
                    if(dependencies) {
                        this.installDependencies(profile, mod);
                    }
                    DownloadsManager.removeDownload(download.name);

                    if(!mod.downloadTemp) {
                        mod = await this.addFileInfo(mod, mod.hosts.curse.fileID);
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
        })
    },

    async downloadModList(profile, list, callback, onUpdate, concurrent) {
        if(concurrent !== 0 && concurrent !== undefined) {
            for(let i = 0; i < concurrent - 1; i++) {
                this.downloadModList(profile, list, callback, onUpdate);
            }
        }

        if(list.length === 0) {
            callback();
        }else{
            const item = Object.assign({}, list[0]);
            if(this.concurrentDownloads.includes(item.cachedID)) {
                const list2 = list.slice();
                list2.shift();
                this.downloadModList(profile, list2, callback, onUpdate);
            }else{
                this.concurrentDownloads.push(item.cachedID);
                const mod = await this.installModVersionToProfile(profile, item, false);
                this.cached.assets[item.cachedID] = mod;
                onUpdate();
                list.shift();
                this.downloadModList(profile, list, callback, onUpdate);
            }
        }
    },

    parseCurseVersion(ver) {
        const cacheID = `versioncache-curse-${new Date(ver.fileDate).getTime()}`
        const obj = {
            displayName: ver.displayName,
            timestamp: new Date(ver.fileDate).getTime(),
            minecraftversions: ver.gameVersion,
            cachedID: cacheID,
            TEMP: {
                downloadUrl: ver.downloadUrl,
            },
            hosts: {
                curse: {
                    fileID: ver.id
                }
            }
        }
        Global.cached.versions[cacheID] = obj;
        
        return obj;
    },

    async getVersionsFromAsset(asset) {
        if(this.cached.assets[asset.cachedID]) {
            if(!this.cached.assets[asset.cachedID].hosts.curse.versionCache) {
                const req = await this.HTTPGet(`https://addons-ecs.forgesvc.net/api/v2/addon/${asset.hosts.curse.id}/files`);
                if(req) {
                    const results = JSON.parse(req);
                    let sorted = results.sort((a, b) => {return new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime()})
                    const final = sorted.map(ver => ver = this.parseCurseVersion(ver));
                    this.cached.assets[asset.cachedID].hosts.curse.versionCache = final;
                    return final;
                }else{
                    return undefined;
                }
            }else{
                return this.cached.assets[asset.cachedID].hosts.curse.versionCache;
            }
        }else{
            const cachedID = `curse-cached-${Global.createID(asset.name)}`;
            this.cached.assets[cachedID] = asset;
            asset.cachedID = cachedID;
            return await this.getVersionsFromAsset(asset);
        }
    },

    async cacheAllAssetInfo(asset) {
        if(!this.cached.assets[asset.cachedID]) {
            this.cached. assets[asset.cachedID] = asset;
        }
        let cachedAsset = this.cached.assets[asset.cachedID];

        if(cachedAsset !== asset) {
            this.cached.assets[asset.cachedID] = asset;
        }

        if(!cachedAsset.description) {
            let newModpack = await this.addDescription(cachedAsset);
            this.cached.assets[asset.cachedID] = newModpack;
        }
    },

    async checkForAssetUpdates(asset) {
        const versions = await this.getVersionsFromAsset(asset);
        let newver;
        for(let ver of versions.reverse()) {
            if(new Date(ver.timestamp).getTime() > asset.version.timestamp) {
                newver = ver;
            }
        }
        return newver;
    },

    async installModpackVersion(mp, version) {
        return new Promise(async (resolve) => {
            if(!fs.existsSync(Global.MCM_TEMP)) {
                fs.mkdirSync(Global.MCM_TEMP);
            }

            const versions = await this.getVersionsFromAsset(mp);
          
            await this.cacheAllAssetInfo(mp);

            let cachedAsset = this.cached.assets[mp.cachedID];

            let downloadUrl, verObj;
            const versionIsNumber = parseInt(version);
            for(let ver of versions) {
                if(versionIsNumber &&
                    (ver.hosts.curse.fileID === parseInt(version)) ||
                    !versionIsNumber &&
                    (ver.displayName === version)) {
                        downloadUrl = ver.TEMP.downloadUrl;
                        verObj = ver;
                }
            }

            const modpack = cachedAsset;
            const infoDownload = path.join(Global.MCM_TEMP, `${modpack.id}-install.zip`);

            DownloadsManager.startFileDownload(`${modpack.name}\n_A_Info`, downloadUrl, infoDownload).then(async () => {
                const zip = new admzip(infoDownload);

                const extractPath = path.join(Global.MCM_TEMP, `${modpack.id}-install/`);
                zip.extractAllTo(extractPath, false);
                fs.unlinkSync(infoDownload);

                const manifest = JSON.parse(fs.readFileSync(path.join(extractPath, `manifest.json`)));
                ProfilesManager.createProfile(modpack.name, manifest.minecraft.version).then((profile) => {
                    profile.hosts = modpack.hosts;
                    profile.iconURL = modpack.iconURL;
                    profile.blurb = modpack.blurb;
                    profile.description = modpack.description;
                    profile.hosts.curse.fullyInstalled = false;
                    profile.hosts.curse.fileID = verObj.id;
                    profile.hosts.curse.fileName = verObj.fileName;
                    profile.setProfileVersion(verObj);
                    profile.changeMCVersion(manifest.minecraft.version);
                    profile.setForgeInstalled(true);
                    profile.setForgeVersion(`${manifest.minecraft.version}-${manifest.minecraft.modLoaders[0].id.substring(6)}`);

                    profile.save();
                    profile.setCurrentState('installing');

                    ProfilesManager.updateProfile(profile);

                    const list = manifest.files.map(file => {
                        const mod = new Mod({
                            hosts: {
                                curse: {
                                    id: file.projectID,
                                    fileID: file.fileID
                                }
                            },
                            cachedID: `mod-install-${file.projectID}`
                        });
                        return mod;
                    });
                    
                    DownloadsManager.createProgressiveDownload(`Curse mods\n_A_${profile.name}`).then(download => {
                        let numberDownloaded = 0;
                        const concurrent = manifest.files.length >= 10 ? 10 : 0;
                        this.downloadModList(profile, list, () => {
                            if(numberDownloaded === manifest.files.length) {
                                DownloadsManager.removeDownload(download.name);
                                this.concurrentDownloads = [];
                                const overridesFolder = path.join(extractPath, `/overrides`);
                                if(fs.existsSync(overridesFolder)) {
                                    fs.readdirSync(overridesFolder).forEach(file => {
                                        if(file === 'mods') {
                                            fs.readdirSync(path.join(overridesFolder, file)).forEach(f => {
                                                Global.copyDirSync(path.join(overridesFolder, file, f), path.join(profile.gameDir, file, f));
                                            })
                                        }else{  
                                            Global.copyDirSync(path.join(overridesFolder, file), path.join(profile.gameDir, file));
                                        }
                                    })
                                }

                                ForgeManager.setupForge(profile).then(() => {
                                    DownloadsManager.startFileDownload(`${profile.name}\n_A_`, modpack.iconURL, path.join(profile.folderpath, '/icon.png')).then(() => {
                                        rimraf.sync(extractPath);
                                        profile.hosts.curse.fullyInstalled = true;
                                        profile.save();
                                        profile.addIconToLauncher();
                                        ProfilesManager.progressState[profile.id] = {
                                            progress: 'installed',
                                            version: profile.version.displayName
                                        }
                                        ProfilesManager.profilesBeingInstalled.splice(ProfilesManager.profilesBeingInstalled.indexOf(modpack.id), 1);
                                        resolve(profile);
                                    })
                                })
                            }
                        }, () => {
                            numberDownloaded++;
                            DownloadsManager.setDownloadProgress(download.name, Math.ceil((numberDownloaded/manifest.files.length) * 100));
                        }, concurrent)
                    })
                })
            })
        })
    },

    async installModpack(mp) {
        return new Promise(async (resolve) => {
            if(!fs.existsSync(Global.MCM_TEMP)) {
                fs.mkdirSync(Global.MCM_TEMP);
            }

            let cachedAsset = this.cached.assets[mp.cachedID];

            if(!cachedAsset.hosts.curse.fileID) {
                const newModpack = await this.addFileInfo(cachedAsset, mp.hosts.curse.latestFileID);
                this.cached.assets[mp.cachedID] = newModpack;
            }

            const modpack = cachedAsset;
            
            await this.installModpackVersion(modpack, modpack.hosts.curse.latestFileID);
            resolve();
        })
    }
}

export default Curse;