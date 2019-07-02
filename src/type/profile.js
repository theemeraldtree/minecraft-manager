import Global from "../util/global";
import LauncherManager from '../manager/launcherManager';
import Mod from "./mod";
import jimp from 'jimp';
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

function Profile(rawOMAF) {
    Object.assign(this, rawOMAF);

    this.local = ['safename', 'versionname', 'folderpath', 'iconpath', 'modsPath', 'state', 'downloadTemp'];
    this.safename = Global.createSafeName(this.name);
    this.versionname = `${this.safename} [Minecraft Manager]`;
    this.folderpath = path.join(Global.PROFILES_PATH + `/${this.id}`).replace("\\","/");
    this.gameDir = path.join(this.folderpath, '/files');
    this.iconpath = path.join(this.folderpath + `/${this.icon}`).replace(/\\/g,"/");
    this.forgeVersion = '1.12.2-14.23.5.2838';
    this.modsPath = path.join(this.gameDir, `/mods/`);
    this.state = '';
    let newList = [];
    if(this.mods) {
        for(let item of this.mods) {
            newList.push(new Mod(item));
        }
    }
    this.mods = newList;

    if(!this.description) {
        this.description = 'No description found'
    }
    
    if(!this.hosts) {
        this.hosts = {};
    }

    if(!this.omafVersion) {
        Global.checkMigration();
        this.omafVersion = '0.1.1';
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
    if(this.forgeInstalled) {
        this.removeAllMods();
    }
    this.minecraftversion = newver;
    this.save();
}

Profile.prototype.launch = function() {
    console.log('launchign!');
    console.log(this);
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
    this.forgeVersion = newver;
    this.save();
}

Profile.prototype.setForgeInstalled = function(installed) {
    this.forgeInstalled = installed;
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
    delete this.forgeVersion;
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
        this.mods.splice(this.mods.indexOf(mod), 1);
        fs.unlink(path.join(this.modsPath, `/${mod.jar}`), () => {
            this.save();
            resolve();
        })
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
    return new Promise((resolve) => {
        const tempPath = path.join(Global.MCM_TEMP, `/profileexport-${this.id}/`);
        if(fs.existsSync(tempPath)) {
            rimraf.sync(tempPath);
        }
        const filesPath = path.join(tempPath, '/files');
        exportProgress('Preparing...');
        Global.copyDirSync(this.folderpath, tempPath);
    
        exportProgress('Removing Online Mods...');
        for(const mod of this.mods) {
            if(mod.hosts) { 
                if(mod.hosts.curse) {
                    fs.unlinkSync(path.join(filesPath, `/mods/${mod.jar}`));
                }
            }
        }

        console.log(exportFolders);
    
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
    
            archive.pipe(fs.createWriteStream(output));
            archive.directory(tempPath, false);
            archive.finalize();
    
            archive.on('finish', () => {
                exportProgress('Cleaning up...');
                rimraf.sync(tempPath);
                exportProgress('Done');
                resolve();
            })
        })
    })
}
export default Profile;