/* eslint-disable */
import mkdirp from 'mkdirp';
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
import OMAFFileAsset from '../type/omafFileAsset';
import FileScanner from './fileScanner';
import World from '../type/world';
import logInit from './logger';
import MCLauncherIntegrationHandler from '../minecraft/mcLauncherIntegrationHandler';
import JavaHandler from '../minecraft/javaHandler';
import MCVersionHandler from '../minecraft/mcVersionHandler';
import AlertManager from '../manager/alertManager';
import latestChangelog from './latestChangelog.txt';

const semver = require('semver');
const { remote } = require('electron');

const { app } = remote;
const path = require('path');
const os = require('os');
const fs = require('fs');

const logger = logInit('Global');

const Global = {
  MCM_PATH: app.getPath('userData'),
  BACKUPS_DIR: path.join(app.getPath('userData'), '/backups'),
  MCM_TEMP: path.join(app.getPath('userData'), '/temp/'),
  PROFILES_PATH: path.join(`${app.getPath('userData')}/profiles/`),
  MC_VERSIONS: [],
  ALL_VERSIONS: [],
  VERSIONS_RAW: [],
  migratorListeners: [],
  cacheUpdateTime: new Date().getTime(),
  cached: {
    versions: {}
  },

  MCM_VERSION: '2.6.0-beta.0',
  MCM_RELEASE_DATE: '2020-07-07',

  MCM_PROFILE_VERSION: 1,
  OMAF_VERSION: '1.0.0',

  /**
   * Abbreivate the supplied number (e.g. 24K, 55M)
   * @param {int} number - Number to abbreivate
   */
  abbreviateNumber(number) {
    const range = [
      {
        divider: 1e6,
        suffix: 'M'
      },
      {
        divider: 1e3,
        suffix: 'K'
      }
    ];

    const greaterRange = range.find(r => number >= r.divider);
    if (greaterRange) {
      return `${(number / greaterRange.divider).toFixed()}${greaterRange.suffix}`;
    }

    if (number) {
      return number.toLocaleString();
    }
    return undefined;
  },
  replaceWindowsPath(string) {
    return string.replace(/\\/g, '/');
  },
  /**
   * Returns true if the days are matching
   * @param {Date} d1 - The date to check
   */
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
      logger.info(`Error checking for toastnews: ${e.toString()}`);
    }
  },
  checkChangelog() {
    const version = SettingsManager.currentSettings.lastVersion;
    if (!version || (semver.gt(this.MCM_VERSION, version) && this.MCM_VERSION.indexOf('beta') === -1)) {
          AlertManager.messageBox(
        `welcome to minecraft manager ${this.MCM_VERSION}`,
        `<div style="overflow-y: auto; max-height: 460px;">${latestChangelog}</div>`
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
    this.VERSIONS_RAW = versions;
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
    if (dev && os.platform() !== 'linux') {
      return path.join('resources');
    }
    if (dev && os.platform() === 'linux') {
      return path.join(__dirname, '../../../../../../resources');
    }

    return path.join(remote.app.getAppPath(), '../resources');
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
      const other = path.join('C:\\Program Files (x86)\\Minecraft Launcher\\MinecraftLauncher.exe');
      if (fs.existsSync(def)) {
        return def;
      } else if (fs.existsSync(other)) {
        return other;
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
        fs.copyFileSync(src, dest);
      }
    } catch (e) {
      ToastManager.createToast('Error', ErrorManager.makeReadable(e));
    }
  },

  scanProfile(profileT) {
    const profile = profileT;
    fs.readdir(path.join(profile.gameDir, '/resourcepacks'), (err, files) => {
      if (files) {
        if (files.length !== profile.resourcepacks.length) {
          files.forEach(file => {
            try {
              FileScanner.scanResourcePack(profile, file);
            } catch (e) {
              logger.error(`[Scan] {${profileT.id}} ${e.toString()}`);
            }
          });
        }
      }
    });

    profile.resourcepacks.forEach(rpT => {
      let rp = rpT;
      if (!(rp instanceof OMAFFileAsset)) rp = new OMAFFileAsset(rp);

      if (!fs.existsSync(path.join(profile.gameDir, rp.getMainFile().path))) {
        logger.info(
          `[Scan] {${profile.id}} Found resource pack ${rp.id} where the main file is missing. Removing it from the profile...`
        );
        profile.deleteSubAsset('resourcepack', rp, false);

        profile.tempNewScanData = true;
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

      if (!fs.existsSync(path.join(profile.gameDir, mod.getMainFile().path))) {
        logger.info(
          `[Scan] {${profile.id}} Found mod ${mod.id} where the main file is missing. Removing it from the profile...`
        );
        profile.deleteSubAsset('mod', mod, false);

        profile.tempNewScanData = true;
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
        logger.info(
          `[Scan] {${profile.id}} Found world ${world.name} where the folder is missing. Removing it from the profile...`
        );
        profile.deleteSubAsset('world', world, false);
        profile.tempNewScanData = true;
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

      worldT.datapacks.forEach(datapackT => {
        let datapack = datapackT;
        if (!(datapack instanceof OMAFFileAsset)) datapack = new OMAFFileAsset(datapack);

        if (!fs.existsSync(path.join(fullPath, datapack.getMainFile().path))) {
          logger.info(
            `[Scan] {${profile.id}} Found datapack ${datapack.name} where the main file is missing. Removing it from the profile...`
          );
          world.deleteDatapack(profile, datapack);
          profile.tempNewScanData = true;
        }
      });
    });

    ProfilesManager.updateProfile(profile);

    setTimeout(() => {
      if (profile.tempNewScanData) {
        profile.save();
      }
    }, 3000);
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
      if (
        (profile.id === '0-default-profile-snapshot' && SettingsManager.currentSettings.runSnapshotInSeperateFolder) ||
        profile.id !== '0-default-profile-snapshot'
      ) {
        this.scanProfile(profile);
      }
    });
  },

  addMigratorListener(listener) {
    this.migratorListeners.push(listener);
  },

  removeMigratorListener(listener) {
    this.migratorListeners.splice(this.migratorListeners.indexOf(listener), 1);
  },

  updateMigratorStep(step) {
    this.migratorListeners.forEach(listener => listener({ active: true, step }));
  },

  setMigratorEnabled(val) {
    this.migratorListeners.forEach(listener => listener({ active: val }));
  },

  // TODO: Refactor this disaster
  /* eslint-disable */
  async checkMigration() {
    let showMigrationmessage = false;
    let majorMigrationToPerform = '';

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
        logger.info(`Running migration on ${profile.id}`);
        if (!fs.existsSync(path.join(profile.profilePath, '/_mcm'))) {
          fs.mkdirSync(path.join(profile.profilePath, '/_mcm'));
          fs.mkdirSync(path.join(profile.profilePath, '/_mcm/icons'));
          fs.mkdirSync(path.join(profile.profilePath, '/_mcm/icons/mods'));
        }
        if (!fs.existsSync(path.join(profile.profilePath, '/_omaf'))) {
          fs.mkdirSync(path.join(profile.profilePath, '/_omaf'));
          fs.mkdirSync(path.join(profile.profilePath, '/_omaf/subAssets'));
        }

        if (profile.minecraftVersion) {
          profile.version.minecraft = {};
          profile.version.minecraft.version = profile.minecraftVersion;
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

      if (!profile.mcm.version) {
        profile.mcm.version = 1;

        majorMigrationToPerform = '2.5';

        mkdirp.sync(path.join(profile.mcmPath, '/binaries'));
        mkdirp.sync(path.join(profile.mcmPath, '/version'));

        profile.mcm.java = {
          overrideRam: false,
          dedicatedRam: SettingsManager.currentSettings.dedicatedRam,
          overrideArgs: false,
          overridePath: false,
          releaseName: '',
          manual: false,
          manualPath: '',
          customArgs: ''
        };

        profile.save();
      }
    }

    if (majorMigrationToPerform === '2.5') {
      const migrateLog = text => {
        logger.info(`[Migration] ${text}`);
      };
      this.setMigratorEnabled(true);
      this.updateMigratorStep('Making necessary folders...');

      migrateLog('Creating all required directories');

      mkdirp.sync(path.join(Global.MCM_PATH, '/shared/libraries'));
      mkdirp.sync(path.join(Global.MCM_PATH, '/shared/binaries'));
      mkdirp.sync(path.join(Global.MCM_PATH, '/shared/assets'));
      mkdirp.sync(path.join(Global.MCM_PATH, '/shared/jars'));

      this.updateMigratorStep('Migrating accounts...');

      migrateLog('Calling integrateAccounts');
      await MCLauncherIntegrationHandler.integrateAccounts();

      if (SettingsManager.currentSettings.accounts[0]) {
        this.updateMigratorStep('Setting active account...');

        migrateLog('Assigning activeAccount to UUID of account 0');

        SettingsManager.currentSettings.activeAccount = SettingsManager.currentSettings.accounts[0].uuid;
      }

      SettingsManager.currentSettings.launcherIntegration = true;
      if (!SettingsManager.currentSettings.java) {
        this.updateMigratorStep('Assigning Java settings...');

        migrateLog('Setting minimum global Java settings');
        SettingsManager.currentSettings.java = {
          path: path.join(Global.MCM_PATH, '/shared/binaries/java/', JavaHandler.getDefaultJavaPath()),
          manual: false,
          customJavaArgs: '',
          customArgsActive: false,
          manualPath: '',
          releaseName: 'Currently installing...'
        };  

        this.updateMigratorStep('Installing Java...');

        migrateLog('Installing java version "latest" to shared java binary path');
        const version = await JavaHandler.installVersion('latest', path.join(Global.MCM_PATH, '/shared/binaries/java'));

        if (version !== 'error') {
          this.updateMigratorStep('Assigning Java name...');

          migrateLog('Assigning latest Global java release name');
          SettingsManager.currentSettings.java.releaseName = version;
          SettingsManager.save();

          ProfilesManager.loadedProfiles.forEach(prof => {
            this.updateMigratorStep(`Setting Java settings for ${prof.name}`);

            migrateLog(`Assigning java release name to ${prof.id}`);
            prof.checkMissingMCMValues();
            prof.mcm.version = 1;
            prof.save();

            this.updateMigratorStep(`Downloading Version JSON for ${prof.name}`);

            migrateLog(`Downloading version json for ${prof.id}`);
            MCVersionHandler.updateProfile(prof);

            if (!fs.existsSync(path.join(prof.profilePath, '/files'))) {
              mkdirp.sync(path.join(prof.profilePath, '/files'));
            }
          });
        }

        migrateLog('Calling integrateProfiles');
        this.updateMigratorStep('Integrating Profiles...');

        MCLauncherIntegrationHandler.integrateProfiles(true);
      }

      this.updateMigratorStep('Saving...');

      SettingsManager.currentSettings.runLatestInIntegrated = true;
      SettingsManager.save();

      this.updateMigratorStep('Copying assets... (this may take a while)');

      // timeout to allow visuals to update
      setTimeout(() => {
        migrateLog('Copying assets directory to shared');
        Global.copyDirSync(path.join(Global.getMCPath(), '/assets/'), path.join(Global.MCM_PATH, '/shared/assets/'));

        this.updateMigratorStep('Copying libraries...');

        // timeout to allow visuals to update
        setTimeout(() => {
          if (fs.existsSync(path.join(Global.getMCPath(), '/libraries/minecraftmanager'))) {
            migrateLog('Copying libraries/minecraftmanager to shared');
            Global.copyDirSync(
              path.join(Global.getMCPath(), '/libraries/minecraftmanager'),
              path.join(Global.MCM_PATH, '/shared/libraries/minecraftmanager')
            );
          } else {
            mkdirp.sync(path.join(Global.MCM_PATH, '/shared/libraries/minecraftmanager'));
          }

          migrateLog('Finished migration');
          this.setMigratorEnabled(false);
        }, 2000);
      }, 2000);
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
      win32: 'C:\\Program Files (x86)\\Minecraft\\runtime\\jre-x64\\bin\\java.exe'
    };

    return platforms[os.platform()];
  },
  // it really annoys me that authors leave stuff like the file extension in the version name
  // all this does is hide it from the user; no actual names are being changed
  cleanVersionName: (name, asset) => {
    if (name) {
      let n = name.replace(/(\.jar|\.zip)$/gim, ''); // Extension removal

      if (asset && asset.name) {
        let assetName = asset.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

        n = n.replace(new RegExp(assetName.replace(/\s/gim, '([_-\\s]+)?'), 'gim'), asset.name); // Fix asset name
        assetName = assetName.replace(/['.]/gim, '');
        n = n.replace(new RegExp(assetName.replace(/\s/gim, '([_-\\s]+)?'), 'gim'), asset.name); // Fix asset name
      }

      n = n.replace(/(?<=[\S])-(?=\S)/gim, ' - '); // Dash spacing
      return n;
    }

    return name;
  }
};

export default Global;
