import SettingsManager from '../manager/settingsManager';
import ProfilesManager from '../manager/profilesManager';
import Mod from '../type/mod';
import Profile from '../type/profile';
import ToastManager from '../manager/toastManager';
import HTTPRequest from '../host/httprequest';
import VersionsManager from '../manager/versionsManager';
import LauncherManager from '../manager/launcherManager';
import LibrariesManager from '../manager/librariesManager';
import ErrorManager from '../manager/errorManager';
import LogManager from '../manager/logManager';
import GenericAsset from '../type/genericAsset';
import FileScanner from './fileScanner';
import World from '../type/world';

const semver = require('semver');
const { remote } = require('electron');

const { app } = remote;
const path = require('path');
const os = require('os');
const fs = require('fs');

const Global = {
  MCM_PATH: app.getPath('userData'),
  BACKUPS_DIR: path.join(app.getPath('userData'), '/backups'),
  MCM_TEMP: path.join(app.getPath('userData'), '/temp/'),
  PROFILES_PATH: path.join(`${app.getPath('userData')}/profiles/`),
  MC_VERSIONS: [],
  ALL_VERSIONS: [],
  cacheUpdateTime: new Date().getTime(),
  cached: {
    versions: {}
  },

  MCM_VERSION: '2.3.1',
  MCM_RELEASE_DATE: '3/16/2020',

  OMAF_VERSION: '1.0.0',

  dateMatches(d1) {
    const d2 = new Date();
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  },
  async checkToastNews() {
    try {
      const req = await HTTPRequest.get('https://theemeraldtree.net/toastnews.json');
      const news = req.data;

      if (SettingsManager.currentSettings.lastToastNewsID === undefined) {
        SettingsManager.setLastToastNewsID(-1);
      }

      if (
        (SettingsManager.currentSettings.lastToastNewsID < news.id || news.repeat) &&
        this.dateMatches(new Date(news.dateToShow))
      ) {
        ToastManager.createToast(news.title, news.message);

        SettingsManager.setLastToastNewsID(news.id);
      }
    } catch (e) {
      ToastManager.createToast('Error', `Error checking for MCM news: ${e.toString()}`);
    }
  },
  checkChangelog() {
    const version = SettingsManager.currentSettings.lastVersion;
    if (!version || (semver.gt(this.MCM_VERSION, version) && this.MCM_VERSION.indexOf('beta') === -1)) {
      ToastManager.createToast(
        `Welcome to ${this.MCM_VERSION}`,
        `With Worlds, Datapacks, UI Tweaks, and more! <a href="https://theemeraldtree.net/mcm/changelogs/${this.MCM_VERSION}">View the changelog</a>`
      );
      SettingsManager.setLastVersion(this.MCM_VERSION);
    }
  },
  async updateMCVersions(firstTime) {
    let versionsJSON;
    let req;
    try {
      if (fs.existsSync(path.join(this.MCM_PATH, '/mcvercache.json'))) {
        this.parseVersionsJSON(JSON.parse(fs.readFileSync(path.join(this.MCM_PATH, '/mcvercache.json'))));
      }
    } catch (e) {
      ToastManager.createToast(
        'Just a quick note',
        "There's a corrupt Minecraft version cache. However this probably won't continue in the future."
      );
    }

    try {
      req = await HTTPRequest.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');
    } catch (e) {
      req = undefined;
    }

    if (req !== undefined) {
      versionsJSON = req.data;
    } else if (req === undefined && firstTime) {
      ToastManager.createToast(
        'Uh oh!',
        "We're having trouble downloading the latest Minecraft versions. This is necessary for Minecraft Manager to function. Check your internet connection and try again"
      );
      return 'no-connection';
    }
    if (versionsJSON) {
      this.parseVersionsJSON(versionsJSON);
    }

    return undefined;
  },
  checkExtraMinecraftVersions() {
    const final = [];
    fs.readdirSync(VersionsManager.getVersionsPath()).forEach(file => {
      if (file.indexOf('[Minecraft Manager]') !== -1) {
        if (!ProfilesManager.loadedProfiles.find(prof => prof.versionname === file)) {
          final.push(file);
        }
      }
    });

    return final;
  },
  checkMinecraftVersions() {
    const totalCount = this.checkExtraMinecraftVersions().length;
    if (totalCount >= 1) {
      ToastManager.createToast(
        'Warning',
        `There are ${totalCount} Minecraft Manager-related version(s) in your Minecraft installation that do not need to exist!`,
        'EXTRA-MINECRAFT-VERSIONS'
      );
    }
  },
  checkExtraMinecraftProfiles() {
    const final = [];
    const obj = JSON.parse(fs.readFileSync(LauncherManager.getLauncherProfiles()));
    Object.keys(obj.profiles).forEach(key => {
      if (key.substring(0, 4) === 'mcm-') {
        if (!ProfilesManager.loadedProfiles.find(prof => key === `mcm-${prof.id}`)) {
          final.push(key);
        }
      }
    });

    return final;
  },
  checkMinecraftProfiles() {
    const totalCount = this.checkExtraMinecraftProfiles().length;

    if (totalCount >= 1) {
      ToastManager.createToast(
        'Warning',
        `There are ${totalCount} Minecraft Manager-related launcher profile(s) in your Minecraft installation that do not need to exist!`,
        'EXTRA-MINECRAFT-PROFILES'
      );
    }
  },
  checkExtraMinecraftLibraries() {
    const final = [];
    fs.readdirSync(LibrariesManager.getMCMLibraries()).forEach(file => {
      if (file.substring(0, 4) === 'mcm-') {
        if (!ProfilesManager.loadedProfiles.find(prof => file === `mcm-${prof.id}`)) {
          final.push(file);
        }
      }
    });

    return final;
  },
  checkMinecraftLibraries() {
    LibrariesManager.checkMissingLibraries();
    const totalCount = this.checkExtraMinecraftLibraries().length;
    if (totalCount >= 1) {
      ToastManager.createToast(
        'Warning',
        `There are ${totalCount} Minecraft-Manager-related launcher libraries in your Minecraft installation that do not need to exist!`,
        'EXTRA-MINECRAFT-LIBRARIES'
      );
    }
  },
  parseVersionsJSON(versionsJSON) {
    const { versions } = versionsJSON;
    this.ALL_VERSIONS = versions.map(ver => ver.id);
    this.MC_VERSIONS = versions.map(ver => {
      if (ver.type === 'release') return ver.id;

      return undefined;
    });

    this.MC_VERSIONS = this.MC_VERSIONS.filter(ver => ver !== undefined);

    fs.writeFileSync(path.join(this.MCM_PATH, '/mcvercache.json'), JSON.stringify(versionsJSON));
  },
  getMCFilterOptions() {
    const copy = this.MC_VERSIONS.slice(0);
    copy.unshift('All');
    return copy;
  },
  getLauncherPath: () => SettingsManager.currentSettings.mcExe,
  createID: name => {
    let newname = name;
    newname = name.replace(/[^\w]/gi, '-').toLowerCase();
    newname = newname.replace('/', '');
    return newname;
  },
  createSafeName: name => name.replace(/[\W_]+/g, ' '),
  getResourcesPath: () => {
    let dev = false;
    if (
      process.defaultApp ||
      /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
      /[\\/]electron[\\/]/.test(process.execPath)
    ) {
      dev = true;
    }
    if (dev) {
      return path.join('resources');
    }
    if (os.platform() === 'win32' || os.platform() === 'darwin') {
      return path.join(remote.app.getAppPath(), '../resources');
    }
    return null;
  },
  getTypeString: obj => {
    if (obj instanceof Mod) {
      return 'mod';
    }
    if (obj instanceof Profile) {
      return 'profile';
    }

    return undefined;
  },
  getDefaultMinecraftPath: () => {
    if (os.platform() === 'win32') {
      const dotMinecraft = path.join(app.getPath('appData'), '.minecraft');
      if (fs.existsSync(dotMinecraft)) {
        return dotMinecraft;
      }
      return app.getPath('appData');
    }
    if (os.platform() === 'darwin') {
      const mc = path.join(app.getPath('appData'), 'minecraft');
      if (fs.existsSync(mc)) {
        return mc;
      }
      return app.getPath('appData');
    }
    if (os.platform() === 'linux') {
      const mc = path.join(os.homedir(), '.minecraft');
      if (fs.existsSync(mc)) return mc;
      return '/';
    }
    return '/';
  },
  getDefaultMCExePath: () => {
    if (os.platform() === 'win32') {
      const def = path.join('C:\\Program Files (x86)\\Minecraft\\MinecraftLauncher.exe');
      if (fs.existsSync(def)) {
        return def;
      }
      return path.join('C:\\Program Files (x86)');
    }
    if (os.platform() === 'darwin') {
      return path.join('/Applications/');
    }
    if (os.platform() === 'linux') {
      return path.join('/opt/minecraft-launcher/minecraft-launcher');
    }

    return undefined;
  },
  getMCPath: () => SettingsManager.MC_HOME,
  copyDirSync(src, dest) {
    try {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      if (exists && isDirectory) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach(childItem => {
          this.copyDirSync(path.join(src, childItem), path.join(dest, childItem));
        });
      } else if (!fs.existsSync(dest)) {
        fs.linkSync(src, dest);
      }
    } catch (e) {
      ToastManager.createToast('Error', ErrorManager.makeReadable(e));
    }
  },

  // why does this function exist? you ask
  // well...... sometimes people like to mess with stuff they shouldn't mess with
  // they delete jar files, add resourcepacks, without letting minecraft manager know
  // (not using minecraft manager to do it)
  // this function scans all the profiles, looking to see if the user has made any changes
  // if it finds them, it attempts to understand it and sync minecraft manager's subassets
  // with those that the user has changed
  scanProfiles() {
    ProfilesManager.loadedProfiles.forEach(profile => {
      fs.readdir(path.join(profile.gameDir, '/resourcepacks'), (err, files) => {
        if (files) {
          if (files.length !== profile.resourcepacks.length) {
            files.forEach(file => {
              FileScanner.scanResourcePack(profile, file);
            });
          }
        }
      });

      profile.resourcepacks.forEach(rpT => {
        let rp = rpT;
        if (!(rp instanceof GenericAsset)) rp = new GenericAsset(rp);

        if (!fs.existsSync(path.join(profile.gameDir, rp.getMainFile().path))) {
          LogManager.log(
            'info',
            `[scan] {${profile.id}} Found resource pack ${rp.name} where the main file is missing. Removing it from the profile...`
          );
          profile.deleteSubAsset('resourcepack', rp);
        }
      });

      fs.readdir(path.join(profile.gameDir, '/mods'), (err, files) => {
        if (files) {
          if (files.length !== profile.mods.length) {
            files.forEach(file => {
              FileScanner.scanMod(profile, file);
            });
          }
        }
      });

      profile.mods.forEach(modT => {
        let mod = modT;
        if (!(mod instanceof Mod)) mod = new Mod(mod);

        if (!fs.existsSync(path.join(profile.gameDir, mod.getJARFile().path))) {
          LogManager.log(
            'info',
            `[scan] {${profile.id}} Found mod ${mod.name} where the main file is missing. Removing it from the profile...`
          );
          profile.deleteSubAsset('mod', mod);
        }
      });

      fs.readdir(path.join(profile.gameDir, '/saves'), (err, files) => {
        if (files) {
          if (files.length !== profile.worlds.length) {
            files.forEach(file => {
              FileScanner.scanWorld(profile, file);
            });
          }
        }
      });

      profile.worlds.forEach(worldT => {
        let world = worldT;
        if (!(world instanceof World)) world = new World(world);

        const fullPath = path.join(profile.gameDir, world.getMainFile().path);

        if (!fs.existsSync(path.join(profile.gameDir, world.getMainFile().path))) {
          LogManager.log(
            'info',
            `[scan] {${profile.id}} Found world ${world.name} where the folder is missing. Removing it from the profile...`
          );
          profile.deleteSubAsset('world', world);
        } else if (fs.existsSync(path.join(fullPath, '/datapacks'))) {
          fs.readdir(path.join(fullPath, '/datapacks'), (err, files) => {
            if (files) {
              if (files.length !== world.datapacks.length) {
                files.forEach(file => {
                  FileScanner.scanDatapack(profile, world, file);
                });
              }
            }
          });
        }
      });
    });
  },

  /* eslint-disable */
  checkMigration() {
    let showMigrationmessage = false;
    for (const profile of ProfilesManager.loadedProfiles) {
      // From beta 4.1 and earlier there was no info about the OMAF format version
      if (!profile.omafVersion) {
        profile.omafVersion = '0.1';

        if (profile.hosts.curse) {
          profile.hosts.curse.fullyInstalled = true;
        }

        profile.save();
      } else if (profile.omafVersion === '0.1') {
        profile.omafVersion = '0.1.1';

        profile.version = 'unknown';
        profile.save();
      } else if (profile.omafVersion === '0.1.1') {
        profile.omafVersion = '0.1.2';
        if (profile.hosts.curse) {
          profile.hosts.curse.slug = profile.hosts.curse.id;
          profile.hosts.curse.id = 'unknown';
        }

        if (profile.mods) {
          for (const mod of profile.mods) {
            if (mod.hosts) {
              if (mod.hosts.curse) {
                mod.hosts.curse.slug = mod.hosts.curse.id;
                mod.hosts.curse.id = 'unknown';
              }
            }
          }
        }

        profile.addIconToLauncher();

        profile.save();
      } else if (profile.omafVersion === '0.1.2') {
        profile.omafVersion = '0.1.3';
        if (!(profile.version instanceof Object)) {
          profile.version = {
            displayname: profile.version,
            timestamp: profile.versionTimestamp
          };

          profile.versionTimestamp = undefined;
        }

        profile.save();

        showMigrationmessage = true;
      } else if (profile.omafVersion === '0.1.3') {
        LogManager.log('info', `[GLOBAL] Running migration on ${profile.name}`);
        if (!fs.existsSync(path.join(profile.profilePath, '/_mcm'))) {
          fs.mkdirSync(path.join(profile.profilePath, '/_mcm'));
          fs.mkdirSync(path.join(profile.profilePath, '/_mcm/icons'));
          fs.mkdirSync(path.join(profile.profilePath, '/_mcm/icons/mods'));
        }
        if (!fs.existsSync(path.join(profile.profilePath, '/_omaf'))) {
          fs.mkdirSync(path.join(profile.profilePath, '/_omaf'));
          fs.mkdirSync(path.join(profile.profilePath, '/_omaf/subAssets'));
        }

        if (profile.minecraftversion) {
          profile.version.minecraft = {};
          profile.version.minecraft.version = profile.minecraftversion;
        }

        for (const mod of profile.mods) {
          if (mod.version.minecraftversions) {
            mod.version.minecraft = {
              supportedVersions: mod.version.minecraftversions
            };

            mod.version.minecraftversions = undefined;
          }

          if (mod.version.hosts) {
            mod.version.hosts = undefined;
          }

          if (mod.iconURL) {
            mod.icon = mod.iconURL;
            mod.iconURL = undefined;
          }

          if (mod.files) {
            if (mod.files[0]) {
              mod.files[0].path = `mods/${mod.files[0].path}`;
            }
          }

          if (mod.url) {
            mod.url = undefined;
          }

          mod.omafVersion = '1.0.0';
        }

        if (profile.version.minecraftversions) {
          profile.version.minecraftversions = undefined;
        }

        if (profile.customVersions) {
          profile.frameworks = profile.customVersions;
          profile.customVersions = undefined;
        }
        profile.save();
      }
    }

    if (showMigrationmessage) {
      ToastManager.createToast(
        'Hey There!',
        'Hello there beta tester! Just a quick message about this new version: your old profiles will not work 100%. Some features may work, some may not. This is due to internal restructuring as to how many things are stored. We hope you understand!'
      );
    }

    ProfilesManager.updateReloadListeners();
  },
  /* eslint-enable */
  updateCache() {
    Global.cacheUpdateTime = new Date().getTime();
  },
  cacheImage(image) {
    const img = new Image();
    img.src = image;
  },
  getJavaPath() {
    const platforms = {
      win32: 'C:\\Program Files (x86)\\Minecraft Launcher\\runtime\\jre-x64\\bin\\java.exe'
    };

    return platforms[os.platform()];
  },
  // it really annoys me that authors leave stuff like the file extension in the version name
  // all this does is hide it from the user; no actual names are being changed
  cleanVersionName: name => {
    let currentName = name;
    if (
      currentName.substring(currentName.length - 4) === '.zip' ||
      currentName.substring(currentName.length - 4) === '.jar'
    ) {
      currentName = name.substring(0, currentName.length - 4);
    }
    return currentName;
  }
};

export default Global;
