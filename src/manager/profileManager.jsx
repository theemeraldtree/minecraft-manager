import Profile from '../util/profile';
import FileUtils from '../util/fileUtils';
import uniqid from 'uniqid';
const fs = require('fs');
const admzip = require('adm-zip');
const path = require('path');
class ProfileManager {
    constructor() {
        this.profiles = [];
    }

    loadProfiles() {

        this.profiles = [];
        if(fs.existsSync(FileUtils.getAppPath())) { 
            let loaded = 0;
            let toLoad = 0;
            return new Promise((resolve) =>  {
                fs.readdir(path.join(FileUtils.getAppPath(), '/profiles'), (err, files) => {
                    files.forEach((file) => {
                        if(fs.lstatSync(path.join(FileUtils.getAppPath(), '/profiles/', file)).isDirectory()) {
                            if(file !== '__MAXOSX' && file !== '__MACOS') {
                                toLoad++;
                                var profile = new Profile(file);
                                profile.load().then(() => {
                                    loaded++;
                                    if(loaded === toLoad && toLoad != 0) {
                                        resolve(this.profiles); 
                                    }
                                })
                                this.profiles.push(profile);
                            }
                        }
        
                    });

                    if(files.length === 0) {
                        resolve([]);
                    }

                })


            });
                   
        }
        return new Promise((resolve, reject) => {
            reject('Unknown error');
        });
    }

    getProfileFromId(id) {
        for(let profile of this.profiles) {
            if(profile.id === id) {
                return profile;
            }
        }
        return null;
    }

    isCurseModpackInstalled = (modpack) => {
        console.log(modpack);
        console.log(this.profiles);
        for(let profile of this.profiles) {
            console.log(modpack.curseID + ' ' + profile.curseID);
            if(modpack.curseID === profile.curseID) {
                return true;
            }
        }
        return false;
    }

    createProfile = (profile) => {
        this.profiles.push(profile);
        fs.mkdirSync(path.join(FileUtils.getAppPath(), `/profiles/${profile.id}`));
        fs.mkdirSync(path.join(FileUtils.getAppPath(), `/profiles/${profile.id}/files`));
        fs.mkdirSync(path.join(FileUtils.getAppPath(), `/profiles/${profile.id}/files/mods`));
        profile.save();
    }

    importProfile = (loc, status) => {
        return new Promise((resolve, reject) => {
            status('Extracting...');
            const zip = new admzip(loc);
            let importPath = path.join(FileUtils.getAppPath(), `/temp/profileimport-${uniqid()}/`);
            zip.extractAllTo(importPath, true);
            status('Reading files...');
            let json = JSON.parse(fs.readFileSync(path.join(importPath, `/profile.json`)));
            console.log(json);
            let profile = new Profile(json.packId);
            profile.name = json.packName;
            profile.description = json.description;
            profile.mods = json.mods;
            profile.forgeVersion = json.forgeVersion;
            profile.forgeMCVer = json.forgeMCVer;
            profile.rawForge = json.rawForge;
            profile.mcVersion = json.mcVersion;
            profile.versionname = json.versionname;
            if(this.getProfileFromId(json.packId) || fs.existsSync(path.join(FileUtils.getAppPath(), `/profiles/${profile.id}`))) {
                console.log('error');
                reject('already-exists');
                return;
            }
            if(fs.existsSync(path.join(importPath, `/icon.png`))) {
                profile.icon = path.join(FileUtils.getAppPath(), `/profiles/${profile.id}/icon.png`);
            }
            this.createProfile(profile);
            status('Copying files...');
            FileUtils.copy(path.join(importPath, `/files`), path.join(FileUtils.getAppPath(), `/profiles/${profile.id}/files`));
            if(fs.existsSync(path.join(importPath, `/icon.png`))) {
                FileUtils.copy(path.join(importPath, `/icon.png`), path.join(FileUtils.getAppPath(), `/profiles/${profile.id}/icon.png`));
            }
            status('Installing mods...');
            profile.installMods(status).then(() => {
                status('Installing forge...');
                profile.installForgeVersion(profile.forgeVersion, (update) => {
                    status(update);
                }).then(() => {
                    FileUtils.copy(path.join(importPath, `/profile.json`), path.join(FileUtils.getAppPath(), `/profiles/${profile.id}/profile.json`));
                    profile.load();
                    if(fs.existsSync(path.join(importPath, `/icon.png`))) {
                        profile.icon = path.join(FileUtils.getAppPath(), `/profiles/${profile.id}/icon.png`);
                    }
                    profile.save();
                    FileUtils.delete(importPath);
                    resolve();
                })
            });
        })
    }
}

export default new ProfileManager();