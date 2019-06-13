import Global from "../util/global";
import LauncherManager from '../manager/launcherManager';
const path = require('path');
const fs = require('fs');

function Profile(rawOMAF) {
    Object.assign(this, rawOMAF);

    this.local = ['folderpath', 'iconpath'];
    this.folderpath = path.join(Global.PROFILES_PATH + `/${this.id}`).replace("\\","/");
    this.gameDir = path.join(this.folderpath, '/files');
    this.iconpath = path.join(this.folderpath + `/${this.icon}`).replace(/\\/g,"/");
    this.forgeVersion = '1.12.2-14.23.5.2838'
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

export default Profile;