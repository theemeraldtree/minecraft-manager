import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import archiver from 'archiver';
import { remote } from 'electron';
import Jimp from 'jimp';
import OAMFAsset from './omafAsset';
import Global from '../util/global';
import FSU from '../util/fsu';
import Mod from './mod';
import OMAFFileAsset from './omafFileAsset';
import World from './world';
import LauncherManager from '../manager/launcherManager';
import ToastManager from '../manager/toastManager';
import ErrorManager from '../manager/errorManager';
import ProfilesManager from '../manager/profilesManager';
import VersionsManager from '../manager/versionsManager';
import LibrariesManager from '../manager/librariesManager';
import Hosts from '../host/Hosts';
import SettingsManager from '../manager/settingsManager';
import logInit from '../util/logger';
import DirectLauncherManager from '../manager/directLauncherManager';
import MCVersionHandler from '../minecraft/mcVersionHandler';
import MCLauncherIntegrationHandler from '../minecraft/mcLauncherIntegrationHandler';

export default class Profile extends OAMFAsset {
  /**
   * Profile Class
   * @param {Object} json - The JSON object this Profile is being created from
   */
  constructor(json) {
    super(json);

    if (json.isDefaultProfile) this.isDefaultProfile = json.isDefaultProfile;
    if (json.mcmSyncOptionsTXT) this.mcmSyncOptionsTXT = json.mcmSyncOptionsTXT;

    this.logger = logInit(`{${json.id}}`);

    this.error = false;

    this.initLocalValues();
    this.loadSubAssets();
    this.checkMissingDirectories();
  }

  /**
   * Initializes Local Values for this Profile
   */
  initLocalValues() {
    this.profilePath = path.join(Global.PROFILES_PATH, `/${this.id}`);

    if (!this.gameDir) this.gameDir = path.join(this.profilePath, '/files');

    this.checkMissingMCMValues();

    this.subAssetsPath = path.join(this.profilePath, '/_omaf/subAssets');
    this.mcmPath = path.join(this.profilePath, '/_mcm/');

    this.safename = Global.createSafeName(this.name);
    this.versionname = `${this.safename} [Minecraft Manager]`;

    if (this.version && this.version.minecraft) {
      this.minecraftVersion = this.version.minecraft.version;
    }

    this.modsPath = path.join(this.gameDir, '/mods');

    if (this.icon) {
      if (this.icon.substring(0, 4) === 'http' || this.isDefaultProfile) {
        this.iconPath = this.icon;
      } else {
        // backslashes are replaced with forward slashes because they're being used as escape characters
        this.iconPath = path.join(this.profilePath, this.icon).replace(/\\/g, '/');
      }
    }

    if (!this.mods) this.mods = [];
    if (!this.resourcepacks) this.resourcepacks = [];
    if (!this.worlds) this.worlds = [];
    if (!this.hosts) this.hosts = {};
    if (!this.frameworks) this.frameworks = {};
    if (this.hosts && this.hosts.curse && !this.hosts.curse.fullyInstalled) this.error = true;

    this.progressState = {};
  }

  /**
   * Checks for missing directories, and if they're missing, creates them
   */
  checkMissingDirectories() {
    if (this.installed) {
      FSU.createDirIfMissing(path.join(this.profilePath, '/_mcm/icons/resourcepacks'));
      FSU.createDirIfMissing(path.join(this.profilePath, '/_mcm/icons/worlds'));
      FSU.createDirIfMissing(path.join(this.profilePath, '/_mcm/icons/mods'));
    }
  }

  /**
   * Reads and imports the requested subasset
   * @param {string} subAsset - The file name of the subasset (e.g. mods.json)
   */
  readSubAsset(subAsset) {
    const subAssetPath = path.join(this.subAssetsPath, subAsset);
    if (fs.existsSync(subAssetPath)) {
      let json;
      try {
        json = FSU.readJSONSync(subAssetPath);
      } catch (err) {
        ToastManager.createToast(
          'Error',
          `Unable to read OMAF subAsset File "${subAsset}" in profile "${this.name}"! This is very bad!`
        );
        return;
      }

      let index;
      const { assetType } = json;
      if (assetType === 'mod' || assetType === 'mods') {
        index = 'mods';
      } else if (assetType === 'resourcepack') {
        index = 'resourcepacks';
      } else if (assetType === 'world') {
        index = 'worlds';
      }

      this[index] = json.assets
        .filter(asset => asset !== undefined && asset !== null)
        .map(asset => {
          let assetObj;
          if (index === 'mods') {
            assetObj = new Mod(asset);
          } else if (index === 'resourcepacks') {
            assetObj = new OMAFFileAsset(asset);
          } else if (index === 'worlds') {
            assetObj = new World(asset);
          }

          // make sure the icon works
          if (assetObj.icon) {
            if (assetObj.icon.substring(0, 4) === 'http') {
              assetObj.iconPath = assetObj.icon;
            } else if (assetObj.icon.substring(0, 5) === 'game:') {
              // when an icon starts with "game:", it means it's pulling the icon directly from the game directory

              // Latest profile handles this differently
              if (this.id === '0-default-profile-latest') {
                assetObj.iconPath = path.join(Global.getMCPath(), assetObj.icon.substring(5)).replace(/\\/g, '/');
              } else {
                assetObj.iconPath = path.join(this.gameDir, assetObj.icon.substring(5)).replace(/\\/g, '/');
              }
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

          // set a progress state (for this profile) for each
          this.progressState[asset.id] = {
            progress: 'installed',
            version: asset.version?.displayName
          };

          assetObj.installed = true;

          return assetObj;
        });
    }
  }

  /**
   * Overrides a Global setting for this profile
   * @param {string} setting - The setting to override
   * @param {boolean} value - The value to set it to
   */
  setOverride(setting, value) {
    switch (setting) {
      case 'java-path':
        this.mcm.java.overridePath = value;
        this.save();
        break;
      case 'ram':
        this.mcm.java.overrideRam = value;
        this.save();
        break;
      case 'custom-ram':
        this.mcm.java.dedicatedRam = value;
        this.save();
        break;
      case 'java-args':
        this.mcm.java.overrideArgs = value;
        this.save();
        break;
      case 'java-custom-args':
        this.mcm.java.customArgs = value;
        this.save();
        break;
      case 'java-install-path':
        this.mcm.java.path = value;
        this.save();
        break;
      case 'java-releasename':
        this.mcm.java.releaseName = value;
        this.save();
        break;
      case 'java-manual':
        this.mcm.java.manual = value;
        this.save();
        break;
      case 'java-manual-path':
        this.mcm.java.manualPath = value;
        this.save();
        break;
      default:
        break;
    }
  }

  /**
   * Load the sub assets from this profile (e.g. mods, resourcepacks, etc)
   * @param {boolean} force - Force loading sub assets, even if this is a default profile
   */
  loadSubAssets(force) {
    if (!this.isDefaultProfile || force) {
      this.readSubAsset('mods.json');
      this.readSubAsset('resourcepacks.json');
      this.readSubAsset('worlds.json');
    }
  }

  /**
   * Forces a refresh of a sub asset
   * @param {string} subAsset - The sub asset to refresh
   */
  refreshSubAsset(subAsset) {
    if (subAsset === 'mods') {
      this.mods = [];
      this.readSubAsset('mods.json');
    } else if (subAsset === 'worlds') {
      this.worlds = [];
      this.readSubAsset('worlds.json');
    } else if (subAsset === 'resourcepacks') {
      this.resourcepacks = [];
      this.readSubAsset('resourcepacks.json');
    }

    Global.scanProfile(this);

    setTimeout(() => {
      ProfilesManager.updateProfile(this);
    }, 2000);
  }

  // TODO: Write JSDoc info for these functions

  hasFramework() {
    return this.frameworks.forge || this.frameworks.fabric;
  }

  openGameDir() {
    this.logger.info('Opening Game Directory');
    try {
      return remote.shell.openExternal(this.gameDir);
    } catch (e) {
      ToastManager.createToast('Error', ErrorManager.makeReadable(e));
      return undefined;
    }
  }

  getPrimaryFramework() {
    if (this.frameworks.forge) {
      return 'forge';
    }
    if (this.frameworks.fabric) {
      return 'fabric';
    }

    return 'none';
  }

  save() {
    this.logger.info('Saving...');
    return new Promise(resolve => {
      fs.writeFile(path.join(this.profilePath, 'profile.json'), JSON.stringify(this.toJSON()), () => {
        if (this.mods) {
          const modOut = this.mods.map(modT => {
            let mod = modT;
            if (!(mod instanceof Mod)) {
              mod = new Mod(mod);
            }
            return mod.toJSON();
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
            if (!(rp instanceof OMAFFileAsset)) {
              rp = new OMAFFileAsset(rp);
            }
            return rp.toJSON();
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

        if (this.worlds) {
          const worldOut = this.worlds.map(worldT => {
            let world = worldT;
            if (!(world instanceof World)) {
              world = new World(world);
            }
            return world.toJSON();
          });

          fs.writeFileSync(
            path.join(this.profilePath, '/_omaf/subAssets/worlds.json'),
            JSON.stringify({
              omafVersion: Global.OMAF_VERSION,
              assetType: 'world',
              assets: worldOut
            })
          );
        }
        resolve();
      });
    });
  }

  getIconBase64() {
    return new Promise((resolve) => {
      Jimp.read(this.iconPath).then(jmp =>
        jmp.contain(128, 128).getBase64(Jimp.MIME_PNG, (err, res) => {
          resolve(res);
        })
      );
    });
  }

  async addIconToLauncher() {
    if (SettingsManager.currentSettings.launcherIntegration) {
      LauncherManager.setProfileData(this, 'icon', await this.getIconBase64());
    }
  }

  setIcon(img) {
    if (fs.existsSync(this.iconPath)) {
      fs.unlinkSync(this.iconPath);
    }

    const newPath = path.join(this.profilePath, `icon${path.extname(img)}`);
    fs.copyFileSync(img, newPath);
    this.icon = `icon${path.extname(img)}`;
    this.iconPath = newPath.replace(/\\/g, '/');
    this.addIconToLauncher();
    this.save();
  }

  resetIcon() {
    this.setIcon(path.join(Global.getResourcesPath(), '/logo-sm.png'));
  }

  launch() {
    return new Promise(async resolve => {
      if (this.id === '0-default-profile-latest') {
        await Global.updateMCVersions();
        this.version.minecraft.version = Global.MC_VERSIONS[0];
        this.minecraftVersion = Global.MC_VERSIONS[0];
      } else if (this.id === '0-default-profile-snapshot') {
        await Global.updateMCVersions();
        this.version.minecraft.version = Global.ALL_VERSIONS[0];
        this.minecraftVersion = Global.ALL_VERSIONS[0];
      }
      try {
        await MCVersionHandler.updateProfile(this, false);
      } catch (e) {
        if (e.message === 'no-version-json') {
          ToastManager.createToast('Unable to launch', 'Minecraft Manager is missing some essential Minecraft Version data. Check your internet connection, and try again.');
        }

        resolve();
        return;
      }
      if (SettingsManager.currentSettings.launcherIntegration && !LauncherManager.profileExists(this)) {
        LauncherManager.createProfile(this);
        this.addIconToLauncher();
        LauncherManager.updateVersion(this);
        LauncherManager.setMostRecentProfile(this);
      }
      DirectLauncherManager.launch(this)
        .then(() => {
          if (SettingsManager.currentSettings.closeOnLaunch) {
            remote.getCurrentWindow().close();
          }
          resolve();
        })
        .catch(e => {
          if (SettingsManager.currentSettings.launcherIntegration) {
            this.logger.info(`Unable to launch Minecraft directly. Opening Launcher instead. Error: ${e.toString()}`);
            this.logger.info(e.stack);
            LauncherManager.openLauncher();
            if (SettingsManager.currentSettings.closeOnLaunch) {
              remote.getCurrentWindow().close();
              resolve();
            }
            resolve();
          } else {
            this.logger.info(`Unable to launch Minecraft directly. Not launcher integrated. Error: ${e.toString()}`);
            ToastManager.createToast('Unable to launch', `${e.toString()}`);
            resolve();
          }
        });
    });
  }

  removeAllMods() {
    this.mods = [];
    rimraf.sync(this.modsPath);
    fs.mkdirSync(this.modsPath);
    this.save();
  }

  changeMCVersion(newVer) {
    if (this.hasFramework()) {
      this.removeAllMods();
    }

    if (!this.hasFramework() && SettingsManager.currentSettings.launcherIntegration) {
      LauncherManager.setProfileData(this, 'lastVersionId', newVer);
    }

    this.version.minecraft.version = newVer;
    this.minecraftVersion = newVer;
    this.save();
  }

  export(output, exportFolders, exportProgress) {
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

          if (mod.hosts && mod.hosts.curse) fs.unlinkSync(path.join(filesPath, mod.getMainFile().path));

          return mod;
        });

        exportProgress('Cleaning up properties...');
        const obj = JSON.parse(fs.readFileSync(path.join(tempPath, '/profile.json')));
        obj.mcm = undefined;

        fs.writeFileSync(path.join(tempPath, '/profile.json'), JSON.stringify(obj));
        rimraf.sync(path.join(tempPath, '/_mcm'));
        exportProgress('Removing non-chosen folders...');
        fs.readdir(path.join(tempPath, '/files'), (err, files) => {
          files.forEach(file => {
            if (exportFolders && !exportFolders[file]) {
              if (file && file !== 'mods') {
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
  }

  // ugh.. frameworks...
  setFrameworkVersion(framework, newVer) {
    if (!this.frameworks[framework]) {
      this.frameworks[framework] = {};
    }

    this.frameworks[framework].version = newVer;
    this.save();
  }

  removeFramework(framework) {
    this.frameworks[framework] = undefined;
    this.save();
  }

  setFrameworkIsInstalling(framework) {
    this.frameworks[framework].isInstalling = true;
    this.save();
  }

  unsetFrameworkIsInstalling(framework) {
    this.frameworks[framework].isInstalling = false;
    ProfilesManager.updateProfile(this);
    this.save();
  }

  // ugh.. subassets...
  getSubAssetFromID(type, id) {
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
    if (type === 'world') {
      if (!this.worlds) {
        this.worlds = [];
      }

      return this.worlds.find(world => world.id === id);
    }

    return undefined;
  }

  addSubAsset(type, asset, opts = {}) {
    if (type === 'mod') {
      if (!this.mods) {
        this.mods = [];
      }
      if (!this.getSubAssetFromID('mod', asset.id)) {
        this.mods.push(asset);
        if (!opts.disableSave) this.save();
      }
    } else if (type === 'resourcepack') {
      if (!this.resourcepacks) {
        this.resourcepacks = [];
      }
      if (!this.getSubAssetFromID('resourcepack', asset.id)) {
        this.resourcepacks.push(asset);
        if (!opts.disableSave) this.save();
      }
    } else if (type === 'world') {
      if (!this.worlds) {
        this.worlds = [];
      }
      if (!this.getSubAssetFromID('world', asset.id)) {
        this.worlds.push(asset);
        if (!opts.disableSave) this.save();
      }
    }
  }

  deleteSubAsset(type, assetT, doSave = true) {
    return new Promise((resolve, reject) => {
      let asset = assetT;

      this.logger.info(`Removing subAsset ${asset.id} with type ${type}`);

      if (type === 'mod') {
        asset = this.mods.find(m => m.id === asset.id);
        if (asset && !(asset instanceof Mod)) {
          asset = new Mod(asset);
        }
        if (asset && asset instanceof Mod && asset.getMainFile().path !== undefined) {
          this.progressState[asset.id] = undefined;
          this.mods.splice(this.mods.indexOf(asset), 1);
          fs.unlink(path.join(this.gameDir, `/${asset.getMainFile().path}`), e => {
            if (e && e.code !== 'ENOENT') {
              if (e) {
                this.logger.error(`Unable to delete subasset ${asset.id}: ${e.toString()}`);
                this.mods.push(asset);
                this.progressState[asset.id] = {
                  progress: 'installed',
                  version: asset.version.displayName
                };
                reject(e);
              } else {
                if (asset.icon) {
                  if (fs.existsSync(path.join(this.profilePath, asset.icon))) {
                    fs.unlinkSync(path.join(this.profilePath, asset.icon));
                  }
                }

                if (doSave) this.save();
                resolve();
              }
            } else {
              if (asset.icon) {
                if (fs.existsSync(path.join(this.profilePath, asset.icon))) {
                  fs.unlinkSync(path.join(this.profilePath, asset.icon));
                }
              }
              if (doSave) this.save();
              resolve();
            }
          });
        } else {
          resolve();
        }
      } else if (type === 'resourcepack') {
        asset = this.resourcepacks.find(a => a.id === asset.id);
        if (asset && !(asset instanceof OMAFFileAsset)) {
          asset = new OMAFFileAsset(asset);
        }
        if (asset && asset instanceof OMAFFileAsset && asset.getMainFile().path !== undefined) {
          this.resourcepacks.splice(this.resourcepacks.indexOf(this.resourcepacks.find(a => a.id === asset.id)), 1);
          this.progressState[asset.id] = undefined;
          if (fs.existsSync(path.join(this.gameDir, `/${asset.getMainFile().path}`))) {
            const callback = () => {
              if (asset.icon) {
                if (fs.existsSync(path.join(this.profilePath, asset.icon))) {
                  fs.unlinkSync(path.join(this.profilePath, asset.icon));
                }
              }

              if (doSave) this.save();

              resolve();
            };

            if (fs.lstatSync(path.join(this.gameDir, `/${asset.getMainFile().path}`)).isDirectory) {
              rimraf(path.join(this.gameDir, `/${asset.getMainFile().path}`), callback);
            } else {
              fs.unlink(path.join(this.gameDir, `/${asset.getMainFile().path}`), callback);
            }
          } else {
            if (doSave) this.save();
            resolve();
          }
        } else {
          resolve();
        }
      } else if (type === 'world') {
        asset = this.worlds.find(a => a.id === asset.id);
        if (asset && !(asset instanceof World)) {
          asset = new World(asset);
        }
        if (asset && asset instanceof World && asset.getMainFile().path !== undefined) {
          this.worlds.splice(this.worlds.indexOf(this.worlds.find(a => a.id === asset.id)), 1);
          this.progressState[asset.id] = undefined;

          const gpath = path.join(this.gameDir, `/${asset.getMainFile().path}`);
          if (fs.existsSync(gpath)) {
            rimraf(gpath, () => {
              if (asset.icon) {
                if (fs.existsSync(path.join(this.profilePath, asset.icon))) {
                  fs.unlinkSync(path.join(this.profilePath, asset.icon));
                }
              }

              if (doSave) this.save();

              resolve();
            });
          } else {
            if (asset.icon) {
              if (fs.existsSync(path.join(this.profilePath, asset.icon))) {
                fs.unlinkSync(path.join(this.profilePath, asset.icon));
              }
            }

            if (doSave) this.save();
            resolve();
          }
        }
      }
    });
  }

  // ugh.. hosts...
  changeHostVersion(host, versionToChangeTo, onUpdate) {
    if (host === 'curse') {
      return new Promise(async (resolve, reject) => {
        this.logger.info(`Changing Curse host version to ${versionToChangeTo}`);
        onUpdate('Creating backup...');
        ProfilesManager.createBackup(this);
        this.mcm.hideFromClient = true;
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
            newprofile.mcm.hideFromClient = false;
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
  }

  // ugh.. renaming...
  rename(newName) {
    return new Promise(resolve => {
      this.logger.info(`Renaming to ${newName}...`);
      const newID = Global.createID(newName);

      this.save().then(async () => {
        try {
          fs.renameSync(this.profilePath, path.join(Global.PROFILES_PATH, `/${newID}/`));

          const safeName = Global.createSafeName(newName);
          if (SettingsManager.currentSettings.launcherIntegration) {
            if (!LauncherManager.profileExists(this)) {
              LauncherManager.createProfile(this);
            }
            LauncherManager.setProfileData(this, 'name', newName);
            LauncherManager.renameProfile(this, newID);
          }

          if (this.hasFramework()) {
            if (SettingsManager.currentSettings.launcherIntegration) {
              LauncherManager.setProfileData(this, 'lastVersionId', `${safeName} [Minecraft Manager]`);
              if (this.frameworks.forge) {
                VersionsManager.renameVersion(this, safeName, 'forge');
              } else if (this.frameworks.fabric) {
                VersionsManager.renameVersion(this, safeName, 'fabric');
              }
            }
            LibrariesManager.renameLibrary(this, newID);
          }


          this.id = newID;
          this.name = newName;
          this.versionname = this.safename;

          if (SettingsManager.currentSettings.launcherIntegration) {
            await MCLauncherIntegrationHandler.integrateAccounts(false);
          }
          this.initLocalValues();
          this.save();
          resolve(this);
        } catch (e) {
          ToastManager.createToast('Error', `Unable to rename: ${ErrorManager.makeReadable(e, 'renaming')}`);
          this.save();
          resolve(this);
        }
      });
    });
  }

  checkMissingMCMValues(force) {
    const { currentSettings } = SettingsManager;

    if (!this.mcm || force) {
      this.mcm = {
        version: Global.MCM_PROFILE_VERSION,
        syncOptionsTXT: currentSettings.defaultsSyncOptionsTXT,
        syncOptionsOF: currentSettings.defaultsSyncOptionsOF,
        syncServers: currentSettings.defaultsSyncServers
      };
    }

    if (!this.mcm.java || force) {
      if (currentSettings.java) {
        this.mcm.java = {
          releaseName: currentSettings.java.releaseName,
          path: currentSettings.java.path,
          manual: false,
          manualPath: '',
          dedicatedRam: currentSettings.dedicatedRam
        };
      }
    }
  }

  applyDefaults() {
    this.logger.info('Applying defaults...');
    const { currentSettings } = SettingsManager;

    this.checkMissingMCMValues();

    let gd = path.join(Global.PROFILES_PATH, '/0-default-profile-latest/files/');
    if (SettingsManager.currentSettings.runLatestInIntegration) {
      gd = Global.getMCPath();
    }

    if (fs.existsSync(path.join(gd, 'options.txt'))) {
      if (currentSettings.defaultsSyncOptionsTXT) {
        fs.linkSync(path.join(gd, 'options.txt'), path.join(this.gameDir, 'options.txt'));
      } else {
        fs.copyFileSync(path.join(gd, 'options.txt'), path.join(this.gameDir, 'options.txt'));
      }
    }

    if (fs.existsSync(path.join(gd, 'optionsof.txt'))) {
      if (currentSettings.defaultsSyncOptionsOF) {
        fs.linkSync(path.join(gd, 'optionsof.txt'), path.join(this.gameDir, 'optionsof.txt'));
      } else if (fs.existsSync(path.join(gd, 'optionsof.txt'))) {
        fs.copyFileSync(path.join(gd, 'optionsof.txt'), path.join(this.gameDir, 'optionsof.txt'));
      }
    }

    if (fs.existsSync(path.join(gd, 'servers.dat'))) {
      if (currentSettings.defaultsSyncServers) {
        fs.linkSync(path.join(gd, 'servers.dat'), path.join(this.gameDir, 'servers.dat'));
      } else {
        fs.copyFileSync(path.join(gd, 'servers.dat'), path.join(this.gameDir, 'servers.dat'));
      }
    }
  }
}
