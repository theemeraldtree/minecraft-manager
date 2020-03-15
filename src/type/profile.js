import path from 'path';
import fs from 'fs';
import Jimp from 'jimp';
import { remote } from 'electron';
import rimraf from 'rimraf';
import archiver from 'archiver';
import LogManager from '../manager/logManager';
import Global from '../util/global';
import Mod from './mod';
import LauncherManager from '../manager/launcherManager';
import ProfilesManager from '../manager/profilesManager';
import ToastManager from '../manager/toastManager';
import ErrorManager from '../manager/errorManager';
import Hosts from '../host/Hosts';
import VersionsManager from '../manager/versionsManager';
import LibrariesManager from '../manager/librariesManager';
import GenericAsset from './genericAsset';
import SettingsManager from '../manager/settingsManager';

export default function Profile(rawomaf) {
  Object.assign(this, rawomaf);

  // these are the "local values"
  // they are NOT saved to disk
  this.localValues = [
    'profilePath',
    'subAssetsPath',
    'iconPath',
    'installed',
    'progressState',
    'fpath',
    'gameDir',
    'safename',
    'minecraftversion',
    'modsPath',
    'versionname',
    'error',
    'state',
    'temp',
    'iconURL'
  ];

  this.initLocalValues = function() {
    LogManager.log('info', `{${this.id}} Initializing Local Values`);

    // all of these are used LOCALLY only

    this.profilePath = path.join(Global.PROFILES_PATH, `/${this.id}`);
    this.gameDir = path.join(this.profilePath, '/files');
    this.safename = Global.createSafeName(this.name);
    this.versionname = `${this.safename} [Minecraft Manager]`;

    if (this.version) {
      if (this.version.minecraft) {
        this.minecraftversion = this.version.minecraft.version;
      }
    }

    this.modsPath = path.join(this.gameDir, '/mods');

    if (this.icon) {
      if (this.icon.substring(0, 4) === 'http') {
        this.iconPath = this.icon;
      } else {
        // backslashes are replaced with forward slashes because they are being used as escape characters
        this.iconPath = path.join(this.profilePath, this.icon).replace(/\\/g, '/');
      }
    }

    this.subAssetsPath = path.join(this.profilePath, '/_omaf/subAssets');

    this.progressState = {};

    if (!this.mods) {
      this.mods = [];
    }

    if (!this.resourcepacks) {
      this.resourcepacks = [];
    }

    if (this.hosts) {
      if (this.hosts.curse) {
        if (!this.hosts.curse.fullyInstalled) {
          this.error = true;
        }
      }
    }
  };

  this.checkMissing = function() {
    // check for missing values in the object

    // if these do not exist (even if they aren't needed), make them anyway
    if (!this.hosts) {
      this.hosts = {};
    }

    if (!this.frameworks) {
      this.frameworks = {};
    }

    if (this.installed) {
      if (!fs.existsSync(path.join(this.profilePath, '/_mcm/icons/resourcepacks'))) {
        fs.mkdirSync(path.join(this.profilePath, '/_mcm/icons/resourcepacks'));
      }
    }
  };

  this.applyDefaults = function() {
    const { currentSettings } = SettingsManager;
    const options = `
            autoJump:${currentSettings.defaultsAutoJump}\n
            tutorialStep:${currentSettings.defaultsShowTutorial ? 'movement' : 'none'}\n
            skipMultiplayerWarning:${!currentSettings.defaultsMultiplayerWarning}
        `
      .replace(/ /g, '')
      .replace(/(^[ \t]*\n)/gm, '');

    fs.writeFileSync(path.join(this.gameDir, 'options.txt'), options);
  };

  this.readSubAsset = function(subAsset) {
    // read a sub asset (such as mods), and place it's info into us

    LogManager.log('info', `{${this.id}} Reading sub-asset ${subAsset}`);
    const json = JSON.parse(fs.readFileSync(path.join(this.subAssetsPath, subAsset)));

    let index;
    if (json.assetType === 'mod' || json.assetType === 'mods') {
      index = 'mods';
    } else if (json.assetType === 'resourcepack') {
      index = 'resourcepacks';
    }
    this[index] = json.assets.map(asset => {
      let assetObj;
      if (index === 'mods') {
        assetObj = new Mod(asset);
      } else if (index === 'resourcepacks') {
        assetObj = new GenericAsset(asset);
      }

      // make sure icon works
      if (assetObj.icon) {
        if (assetObj.icon.substring(0, 4) === 'http') {
          assetObj.iconPath = assetObj.icon;
        } else {
          assetObj.iconPath = path.join(this.profilePath, assetObj.icon).replace(/\\/g, '/');

          if (!fs.existsSync(assetObj.iconPath)) {
            if (assetObj.iconURL) {
              assetObj.iconPath = assetObj.iconURL;
            }
          }
        }
      } else {
        assetObj.iconPath = '';
      }

      // set a progress state (for us) for each
      this.progressState[asset.id] = {
        progress: 'installed',
        version: asset.version.displayName
      };

      // set it installed
      assetObj.installed = true;

      return assetObj;
    });
  };

  this.loadSubAssets = function() {
    // load sub assets (such as mods, resourcepacks)
    const exists = fs.existsSync;

    if (exists(path.join(this.subAssetsPath, 'mods.json'))) {
      this.readSubAsset('mods.json');
    }

    if (exists(path.join(this.subAssetsPath, 'resourcepacks.json'))) {
      this.readSubAsset('resourcepacks.json');
    }
  };

  this.initLocalValues();
  this.checkMissing();
  this.loadSubAssets();

  // usable functions

  this.hasFramework = () => this.frameworks.forge || this.frameworks.fabric;
  this.openGameDir = () => remote.shell.openExternal(this.gameDir);
  this.getPrimaryFramework = () => {
    if (this.frameworks.forge) {
      return 'forge';
    }
    if (this.frameworks.fabric) {
      return 'fabric';
    }

    return 'none';
  };
  this.toJSON = function() {
    const copy = { ...this };

    Object.keys(copy).forEach(x => {
      if (typeof copy[x] === 'function' || this.localValues.includes(x)) copy[x] = undefined;
    });

    copy.localValues = undefined;

    if (this.hosts) {
      if (this.hosts.curse) {
        copy.hosts.curse.localValues = undefined;
        copy.hosts.curse.versionCache = undefined;
      }
    }

    if (this.version) {
      if (this.version.cachedID) {
        copy.version.cachedID = undefined;
      }
      if (this.version.TEMP) {
        copy.version.TEMP = undefined;
      }
      if (this.version.supportedVersions) {
        copy.version.supportedVersions = undefined;
      }

      if (this.version.hosts && this.version.hosts.curse) {
        if (this.version.hosts.curse.localValues) {
          copy.version.hosts.curse.localValues = undefined;
        }
      }
    }

    copy.omafVersion = Global.OMAF_VERSION;
    copy.mods = undefined;
    copy.resourcepacks = undefined;

    return JSON.stringify(copy);
  };

  this.save = function() {
    LogManager.log('info', `{${this.id}} saving...`);
    return new Promise(resolve => {
      fs.writeFile(path.join(this.profilePath, 'profile.json'), this.toJSON(), () => {
        if (this.mods) {
          const modOut = this.mods.map(modT => {
            let mod = modT;
            if (!(mod instanceof Mod)) {
              mod = new Mod(mod);
            }
            return mod.cleanObject();
          });
          fs.writeFileSync(
            path.join(this.profilePath, '/_omaf/subAssets/mods.json'),
            JSON.stringify({
              omafVersion: Global.OMAF_VERSION,
              assetType: 'mod',
              assets: modOut
            })
          );
        }

        if (this.resourcepacks) {
          const rpOut = this.resourcepacks.map(rpT => {
            let rp = rpT;
            if (!(rp instanceof GenericAsset)) {
              rp = new GenericAsset(rp);
            }
            return rp.cleanObject();
          });

          fs.writeFileSync(
            path.join(this.profilePath, '/_omaf/subAssets/resourcepacks.json'),
            JSON.stringify({
              omafVersion: Global.OMAF_VERSION,
              assetType: 'resourcepack',
              assets: rpOut
            })
          );
        }
        resolve();
      });
    });
  };

  this.addIconToLauncher = function() {
    Jimp.read(this.iconPath).then(jmp =>
      jmp.contain(128, 128).getBase64(Jimp.MIME_PNG, (err, res) => {
        if (!err) {
          LauncherManager.setProfileData(this, 'icon', res);
        }
      })
    );
  };

  this.setIcon = function(img) {
    if (fs.existsSync(this.iconPath)) {
      fs.unlinkSync(this.iconPath);
    }

    const newPath = path.join(this.profilePath, `icon${path.extname(img)}`);
    fs.copyFileSync(img, newPath);
    this.icon = `icon${path.extname(img)}`;
    this.iconPath = newPath.replace(/\\/g, '/');
    this.addIconToLauncher();
    this.save();
  };

  this.resetIcon = function() {
    this.setIcon(path.join(Global.getResourcesPath(), '/logo-sm.png'));
  };

  this.launch = function() {
    if (!LauncherManager.profileExists(this)) {
      LauncherManager.createProfile(this);
    }

    this.addIconToLauncher();
    LauncherManager.updateVersion(this);
    LauncherManager.setMostRecentProfile(this);
    LauncherManager.openLauncher();
  };

  this.removeAllMods = function() {
    this.mods = [];
    rimraf.sync(this.modsPath);
    fs.mkdirSync(this.modsPath);
    this.save();
  };

  this.changeMCVersion = function(newVer) {
    if (this.hasFramework()) {
      this.removeAllMods();
    }

    if (!this.hasFramework()) {
      LauncherManager.setProfileData(this, 'lastVersionId', newVer);
    }

    this.version.minecraft.version = newVer;
    this.minecraftversion = newVer;
    this.save();
  };

  this.export = function(output, exportFolders, exportProgress) {
    return new Promise((resolve, reject) => {
      try {
        const tempPath = path.join(Global.MCM_TEMP, `/profileexport-${this.id}/`);
        if (fs.existsSync(tempPath)) {
          rimraf.sync(tempPath);
        }
        const filesPath = path.join(tempPath, '/files');
        exportProgress('Preparing...');
        Global.copyDirSync(this.profilePath, tempPath);

        exportProgress('Removing Online Mods...');
        this.mods = this.mods.map(modT => {
          let mod = modT;
          if (!(mod instanceof Mod)) mod = new Mod(mod);

          if (mod.hosts && mod.hosts.curse) fs.unlinkSync(path.join(filesPath, mod.getJARFile().path));

          return mod;
        });

        exportProgress('Cleaning up properties...');
        const obj = JSON.parse(fs.readFileSync(path.join(tempPath, '/profile.json')));
        if (obj.hideFromClient) {
          obj.hideFromClient = undefined;
          delete obj.hideFromClient;
        }

        fs.writeFileSync(path.join(tempPath, '/profile.json'), JSON.stringify(obj));
        rimraf.sync(path.join(tempPath, '/_mcm'));
        exportProgress('Removing non-chosen folders...');
        fs.readdir(path.join(tempPath, '/files'), (err, files) => {
          files.forEach(file => {
            if (!exportFolders[file]) {
              if (file !== 'mods') {
                rimraf.sync(path.join(filesPath, file));
              }
            }
          });

          exportProgress('Creating archive...');
          const archive = archiver('zip');

          archive.pipe(fs.createWriteStream(output)).on('error', e => {
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
      } catch (e) {
        ToastManager.createToast('Error', ErrorManager.makeReadable(e));
        reject();
      }
    });
  };

  // ugh.. frameworks...
  this.setFrameworkVersion = function(framework, newVer) {
    if (!this.frameworks[framework]) {
      this.frameworks[framework] = {};
    }

    this.frameworks[framework].version = newVer;
    this.save();
  };

  this.removeFramework = function(framework) {
    this.frameworks[framework] = undefined;
    this.save();
  };

  // ugh.. subassets...
  this.getSubAssetFromID = function(type, id) {
    if (type === 'mod') {
      if (!this.mods) {
        this.mods = [];
      }
      return this.mods.find(mod => mod.id === id);
    }
    if (type === 'resourcepack') {
      if (!this.resourcepacks) {
        this.resourcepacks = [];
      }
      return this.resourcepacks.find(rp => rp.id === id);
    }

    return undefined;
  };

  this.addSubAsset = function(type, asset) {
    if (type === 'mod') {
      if (!this.mods) {
        this.mods = [];
      }
      if (!this.getSubAssetFromID('mod', asset.id)) {
        this.mods.push(asset);
        this.save();
      }
    } else if (type === 'resourcepack') {
      if (!this.resourcepacks) {
        this.resourcepacks = [];
      }
      if (!this.getSubAssetFromID('resourcepack', asset.id)) {
        this.resourcepacks.push(asset);
        this.save();
      }
    }
  };

  this.deleteSubAsset = function(type, assetT) {
    return new Promise(resolve => {
      let asset = assetT;
      if (type === 'mod') {
        asset = this.mods.find(m => m.id === asset.id);
        if (!(asset instanceof Mod)) {
          asset = new Mod(asset);
        }
        if (asset && asset instanceof Mod && asset.getJARFile().path !== undefined) {
          this.mods.splice(this.mods.indexOf(asset), 1);
          this.progressState[asset.id] = undefined;
          fs.unlink(path.join(this.gameDir, `/${asset.getJARFile().path}`), () => {
            if (asset.icon) {
              if (fs.existsSync(path.join(this.profilePath, asset.icon))) {
                fs.unlinkSync(path.join(this.profilePath, asset.icon));
              }
            }
            this.save();
            resolve();
          });
        } else {
          resolve();
        }
      } else if (type === 'resourcepack') {
        asset = this.resourcepacks.find(a => a.id === asset.id);
        if (!(asset instanceof GenericAsset)) {
          asset = new GenericAsset(asset);
        }
        if (asset && asset instanceof GenericAsset && asset.getMainFile().path !== undefined) {
          this.resourcepacks.splice(this.resourcepacks.indexOf(this.resourcepacks.find(a => a.id === asset.id)), 1);
          this.progressState[asset.id] = undefined;
          if (fs.existsSync(path.join(this.gameDir, `/${asset.getMainFile().path}`))) {
            const callback = () => {
              if (asset.icon) {
                if (fs.existsSync(path.join(this.profilePath, asset.icon))) {
                  fs.unlinkSync(path.join(this.profilePath, asset.icon));
                }
              }

              this.save();

              resolve();
            };

            if (fs.lstatSync(path.join(this.gameDir, `/${asset.getMainFile().path}`)).isDirectory) {
              rimraf(path.join(this.gameDir, `/${asset.getMainFile().path}`), callback);
            } else {
              fs.unlink(path.join(this.gameDir, `/${asset.getMainFile().path}`), callback);
            }
          } else {
            this.save();
            resolve();
          }
        } else {
          resolve();
        }
      }
    });
  };

  // ugh.. hosts...
  this.changeHostVersion = function(host, versionToChangeTo, onUpdate) {
    if (host === 'curse') {
      return new Promise(async (resolve, reject) => {
        onUpdate('Creating backup...');
        ProfilesManager.createBackup(this);
        this.hideFromClient = true;
        await this.save();
        onUpdate('Moving old folder...');
        const oldpath = path.join(Global.PROFILES_PATH, `/${this.id}-update-${new Date().getTime()}`);
        const oldgamedir = path.join(oldpath, '/files');
        fs.rename(this.profilePath, oldpath, async e => {
          if (e) {
            ToastManager.createToast('Error', ErrorManager.makeReadable(e));
            reject(e);
          } else {
            onUpdate('Installing modpack...');
            const newprofile = await Hosts.installModpackVersion('curse', this, versionToChangeTo);
            newprofile.hideFromClient = false;
            newprofile.save();
            if (fs.existsSync(path.join(oldgamedir, '/saves'))) {
              Global.copyDirSync(path.join(oldgamedir, '/saves'), path.join(this.gameDir, '/saves'));
            }

            if (fs.existsSync(path.join(oldgamedir, '/options.txt'))) {
              fs.copyFileSync(path.join(oldgamedir, '/options.txt'), path.join(this.gameDir, '/options.txt'));
            }

            rimraf.sync(oldpath);
            onUpdate('Reloading profiles...');
            await ProfilesManager.getProfiles();
            resolve(newprofile);
          }
        });
      });
    }

    return undefined;
  };

  // ugh.. renaming...
  this.rename = function(newName) {
    return new Promise(resolve => {
      const newID = Global.createID(newName);
      const safeName = Global.createSafeName(newName);
      if (!LauncherManager.profileExists(this)) {
        LauncherManager.createProfile(this);
      }
      LauncherManager.setProfileData(this, 'name', newName);
      LauncherManager.renameProfile(this, newID);
      if (this.hasFramework()) {
        LauncherManager.setProfileData(this, 'lastVersionId', `${safeName} [Minecraft Manager]`);
        if (this.frameworks.forge) {
          VersionsManager.renameVersion(this, safeName);
        } else if (this.frameworks.fabric) {
          VersionsManager.renameVersionFabric(this, safeName);
        }
        LibrariesManager.renameLibrary(this, newID);
      }

      this.id = newID;
      this.name = newName;
      this.versionname = this.safename;
      this.save().then(() => {
        fs.renameSync(this.profilePath, path.join(Global.PROFILES_PATH, `/${newID}/`));
        this.initLocalValues();
        this.save();
        resolve(this);
      });
    });
  };
}
