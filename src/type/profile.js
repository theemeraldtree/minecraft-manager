import Global from "../util/global";
import LauncherManager from '../manager/launcherManager';
import Mod from "./mod";
const path = require('path');
const fs = require('fs');

function Profile(rawOMAF) {
    Object.assign(this, rawOMAF);

    this.local = ['folderpath', 'iconpath', 'modsPath'];
    this.folderpath = path.join(Global.PROFILES_PATH + `/${this.id}`).replace("\\","/");
    this.gameDir = path.join(this.folderpath, '/files');
    this.iconpath = path.join(this.folderpath + `/${this.icon}`).replace(/\\/g,"/");
    this.forgeVersion = '1.12.2-14.23.5.2838';
    this.modsPath = path.join(this.gameDir, `/mods/`);

    let newList = [];
    if(this.mods) {
        for(let item of this.mods) {
            newList.push(new Mod(item));
        }
    }
    this.mods = newList;

    if(!this.hosts) {
        this.hosts = {};
    }
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

Profile.prototype.changeMCVersion = function(newver) {
    this.minecraftversion = newver;
    this.save();
}

Profile.prototype.launch = function() {
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

Profile.prototype.removeForge = function() {
    this.setForgeInstalled(false);
    delete this.forgeVersion;
    this.save();
}

Profile.prototype.addMod = function(mod) {
    this.mods.push(mod.cleanObject());
    this.save();
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
export default Profile;