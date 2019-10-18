import Global from "../util/global";
import LauncherManager from '../manager/launcherManager';
import Mod from "./mod";
import jimp from 'jimp';
import ProfilesManager from "../manager/profilesManager";
import Curse from "../host/curse/curse";
import VersionsManager from "../manager/versionsManager";
import LibrariesManager from "../manager/librariesManager";
import ToastManager from "../manager/toastManager";
import ErrorManager from "../manager/errorManager";
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

function Profile(rawOMAF) {
    Object.assign(this, rawOMAF);

    this.local = ['launcherVersion', 'installed', 'safename', 'versionname', 'folderpath', 'iconpath', 'modsPath', 'state', 'downloadTemp'];
    this.initLocalValues();
}

Profile.prototype.initLocalValues = function() {
    if(!this.fpath) {
        this.fpath = '__NONE__';
    }
    this.safename = Global.createSafeName(this.name);
    this.versionname = `${this.safename} [Minecraft Manager]`;
    this.folderpath = path.join(this.fpath);
    this.gameDir = path.join(this.folderpath, '/files');
    this.modsPath = path.join(this.gameDir, `/mods/`);
    this.iconpath = path.join(this.folderpath + `/${this.icon}`).replace(/\\/g,"/");
    this.state = '';
    this.installed = true;
    
    this.progressState = {};
    this.error = false;
    let newList = [];
    if(this.mods) {
        for(let item of this.mods) {
            let modItem = Object.assign({}, item);
            modItem.installed = true;
            newList.push(new Mod(modItem));
            this.progressState[item.id] = {
                progress: 'installed',
                version: item.version.displayName
            }
        }
    }
    this.mods = newList;

    if(!this.description) {
        this.description = 'No description found'
    }
    
    if(!this.hosts) {
        this.hosts = {};
    }

    if(!this.customVersions) {
        this.customVersions = {};
    }

    if(!this.omafVersion) {
        this.omafVersion = '0.1.2';
        Global.checkMigration();
    }

    
    if(this.hosts.curse) {
        if(!this.hosts.curse.fullyInstalled) {
            this.error = true;
        }
    }
}

Profile.prototype.setProfileVersion = function(newVer) {
    this.version = newVer;
    this.save();
}

Profile.prototype.toJSON = function() {
    let copy = Object.assign({}, this);
    for(let i of this.local) {
        copy[i] = undefined;
    }
    copy.local = undefined;
    copy.gameDir = undefined;
    copy.error = undefined;
    copy.fpath = undefined;
    copy.iconURL = undefined;
    copy.progressState = undefined;
    if(this.hosts) {
        if(this.hosts.curse) {
            copy.hosts.curse.localValues = undefined;
            copy.hosts.curse.versionCache = undefined;
        }
    }

    if(this.version) {
        if(this.version.TEMP) {
            this.version.TEMP = undefined;
        }

        if(this.version.cachedID) {
            this.version.cachedID = undefined;
        }
    }
    return JSON.stringify(copy);
}

Profile.prototype.save = function() {
    return new Promise((resolve) => {
        fs.writeFile(path.join(this.folderpath, 'profile.json'), this.toJSON(), () => {
            resolve();
        });
    })
}

Profile.prototype.changeBlurb = function(newval) {
    this.blurb = newval;
    this.save();
}

Profile.prototype.removeAllMods = function() {
    this.mods = [];
    rimraf.sync(this.modsPath);
    fs.mkdirSync(this.modsPath)
    this.save();
}
Profile.prototype.changeMCVersion = function(newver) {
    if(this.customVersions.forge) {
        this.removeAllMods();
    }

    if(!this.customVersions.forge) {
        LauncherManager.setProfileData(this, 'lastVersionId', newver);
    }
    this.minecraftversion = newver;
    this.save();
}

Profile.prototype.launch = function() {
    if(!LauncherManager.profileExists(this)) {
        LauncherManager.createProfile(this);
    }
    this.addIconToLauncher();
    LauncherManager.updateVersion(this);
    LauncherManager.setMostRecentProfile(this);
    LauncherManager.openLauncher();
}

Profile.prototype.changeDescription = function(newval) {
    this.description = newval;
    this.save();
}

Profile.prototype.setVersion = function(newver) {
    this.launcherVersion = newver;
    this.save();
}

Profile.prototype.setForgeVersion = function(newver) {
    if(!this.customVersions.forge) {
        this.customVersions.forge = {}
    }
    this.customVersions.forge.version = newver;
    this.save();
}

Profile.prototype.setForgeInstalled = function(installed) {
    if(!this.customVersions.forge && installed) {
        this.customVersions.forge = {};
    }else if(this.customVersions.forge && !installed) {
        this.customVersions.forge = undefined;
    }
    this.save();
}

Profile.prototype.setHostId = function(host, id) {
    if(!this.hosts[host]) {
        this.hosts[host] = {}
    }

    this.hosts[host].id = id;
    this.save();
}

Profile.prototype.removeForge = function() {
    this.setForgeInstalled(false);
    this.save();
}

Profile.prototype.addMod = function(mod) {
    if(!this.getModFromID(mod)) {
        this.mods.push(mod.cleanObject());
        this.save();
    }
}

Profile.prototype.getModFromID = function(id) {
    for(let mod of this.mods) {
        if(mod.id === id) {
            return mod;
        }
    }
    return undefined;
}

Profile.prototype.deleteMod = function(mod) {
    return new Promise((resolve) => {
        mod = this.mods.find(m => m.id === mod.id);
        if(!(mod instanceof Mod)) {
            mod = new Mod(mod);
        }
        if(mod && mod instanceof Mod && mod.getJARFile().path !== undefined) {
            this.mods.splice(this.mods.indexOf(mod), 1);
            this.progressState[mod.id] = undefined;
            fs.unlink(path.join(this.modsPath, `/${mod.getJARFile().path}`), () => {
                this.save();
                resolve();
            })
        }else{
            resolve();
        }
    })
}

Profile.prototype.addIconToLauncher = function() {
    jimp.read(this.iconpath).then(jmp => {
        return jmp
            .contain(128, 128)
            .getBase64(jimp.MIME_PNG, (err, res) => {
                if(!err) {
                    LauncherManager.setProfileData(this, 'icon', res)
                }
            })
    })
}

Profile.prototype.changeIcon = function(img) {
    if(fs.existsSync(this.iconpath)) {
        fs.unlinkSync(this.iconpath);
    }
    jimp.read(img).then(jmp => {
        return jmp
            .contain(128, 128)
            .getBase64(jimp.MIME_PNG, (err, res) => {
                if(!err) {
                    LauncherManager.setProfileData(this, 'icon', res)
                }
            })
    })
    const newPath = path.join(this.folderpath, `icon${path.extname(img)}`);
    fs.copyFileSync(img, newPath);
    this.icon = `icon${path.extname(img)}`;
    this.iconpath = newPath.replace(/\\/g,"/");
    this.save();
}

Profile.prototype.resetIcon = function() {
    this.changeIcon(path.join(Global.getResourcesPath(), '/logo-sm.png'));
}

Profile.prototype.setCurrentState = function(state) {
    this.state = state;
}

Profile.prototype.export = function(output, exportFolders, exportProgress) {
    return new Promise((resolve, reject) => {
        try {
            const tempPath = path.join(Global.MCM_TEMP, `/profileexport-${this.id}/`);
            if(fs.existsSync(tempPath)) {
                rimraf.sync(tempPath);
            }
            const filesPath = path.join(tempPath, '/files');
            exportProgress('Preparing...');
            Global.copyDirSync(this.folderpath, tempPath);
        
            exportProgress('Removing Online Mods...');
            for(let mod of this.mods) {
                if(!(mod instanceof Mod)) {
                    mod = new Mod(mod);
                }
                if(mod.hosts) { 
                    if(mod.hosts.curse) {
                        fs.unlinkSync(path.join(filesPath, `/mods/${mod.getJARFile().path}`));
                    }
                }
            }
        
            exportProgress('Cleaning up properties...');
            let obj = JSON.parse(fs.readFileSync(path.join(tempPath, '/profile.json')));
            if(obj.hideFromClient) {
                obj.hideFromClient = undefined;
                delete obj.hideFromClient;
            }
    
            fs.writeFileSync(path.join(tempPath, '/profile.json'), JSON.stringify(obj));
    
            exportProgress('Removing non-chosen folders...');
            fs.readdir(path.join(tempPath, '/files'), (err, files) => {
                files.forEach(file => {
                    if(!exportFolders[file]) {
                        if(file !== 'mods') {
                            rimraf.sync(path.join(filesPath, file));
                        }
                    }
                });
        
                exportProgress('Creating archive...');
                const archive = archiver('zip');
        
                archive.pipe(fs.createWriteStream(output)).on('error', (e) => {
                    ToastManager.createToast('Error archiving', ErrorManager.makeReadable(e));
                    reject();
                });
                archive.directory(tempPath, false);
                archive.finalize();
        
                archive.on('finish', () => {
                    exportProgress('Cleaning up...');
                    rimraf.sync(tempPath);
                    exportProgress('Done');
                    resolve();
                });
            });
        }catch(e) {
            ToastManager.createToast('Error', ErrorManager.makeReadable(e));
            reject();
        }
    })
}

Profile.prototype.changeCurseVersion = function(versionToChangeTo, onUpdate) {
    return new Promise(async (resolve, reject) => {
            onUpdate('Creating backup...');
            ProfilesManager.createBackup(this);
            this.hideFromClient = true;
            await this.save();
            onUpdate('Moving old folder...');
            const oldpath = path.join(Global.PROFILES_PATH, `/${this.id}-update-${new Date().getTime()}`);
            const oldgamedir = path.join(oldpath, '/files');
            fs.rename(this.folderpath, oldpath, async (e) => {
                if(e) {
                    ToastManager.createToast('Error', ErrorManager.makeReadable(e));
                    reject(e);
                }else{
                    onUpdate('Installing modpack...');
                    const newprofile = await Curse.installModpackVersion(this, versionToChangeTo);
                    newprofile.hideFromClient = false;
                    newprofile.save();
                    if(fs.existsSync(path.join(oldgamedir, `/saves`))) {
                        Global.copyDirSync(path.join(oldgamedir, `/saves`), path.join(this.gameDir, `/saves`));
                    }
            
                    if(fs.existsSync(path.join(oldgamedir, '/options.txt'))) {
                        fs.copyFileSync(path.join(oldgamedir, '/options.txt'), path.join(this.gameDir, '/options.txt'));
                    }
            
                    rimraf.sync(oldpath);
                    onUpdate('Reloading profiles...');
                    await ProfilesManager.getProfiles();
                    resolve(newprofile);
                
                }
            });
    })
}

Profile.prototype.rename = function(newName) {
    const newID = Global.createID(newName);
    const safeName = Global.createSafeName(newName);
    if(!LauncherManager.profileExists(this)) {
        LauncherManager.createProfile(this);
    }
    LauncherManager.setProfileData(this, 'name', newName);
    LauncherManager.renameProfile(this, newID);
    if(this.customVersions.curse) {
        LauncherManager.setProfileData(this, 'lastVersionId', `${safeName} [Minecraft Manager]`);
        VersionsManager.renameVersion(this, safeName);
        LibrariesManager.renameLibrary(this, newID);
    }

    this.id = newID;
    this.name = newName;
    this.versionname = this.safename;

    fs.renameSync(this.folderpath, path.join(Global.PROFILES_PATH, `/${newID}/`));
    this.initLocalValues();
    this.save();
}
export default Profile;