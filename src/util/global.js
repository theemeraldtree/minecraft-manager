import AdmZip from 'adm-zip';
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

  MCM_VERSION: '2.3.0',
  MCM_RELEASE_DATE: '2/27/2020',

  OMAF_VERSION: '1.0.0',

  dateMatches(d1) {
    const d2 = new Date();
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  },
  async checkToastNews() {
    try {
      const req = await HTTPRequest.get('https://theemeraldtree.net/toastnews.json');
      const news = JSON.parse(req);

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
        `With Forge 1.13+ support, Resource Packs, UI Tweaks, and more. <a href="https://theemeraldtree.net/mcm/changelogs/${this.MCM_VERSION}">View the changelog</a>`
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
      versionsJSON = JSON.parse(req);
    } else if (req == undefined && firstTime) {
      ToastManager.createToast(
        'Uh oh!',
        "We're having trouble downloading the latest Minecraft versions. This is necessary for Minecraft Manager to function. Check your internet connection and try again"
      );
      return 'no-connection';
    }
    if (versionsJSON) {
      this.parseVersionsJSON(versionsJSON);
    }
  },
  checkMinecraftVersions() {
    let totalCount = 0;
    fs.readdirSync(VersionsManager.getVersionsPath()).forEach(file => {
      if (file.indexOf('[Minecraft Manager]') !== -1) {
        if (!ProfilesManager.loadedProfiles.find(prof => prof.versionname === file)) {
          totalCount++;
        }
      }
    });
    if (totalCount) {
      ToastManager.createToast(
        'Warning',
        `There are ${totalCount} Minecraft Manager-related version(s) in your Minecraft installation that do not need to exist!`,
        'EXTRA-MINECRAFT-VERSIONS'
      );
    }
  },
  checkMinecraftProfiles() {
    const obj = JSON.parse(fs.readFileSync(LauncherManager.getLauncherProfiles()));
    let totalCount = 0;
    Object.keys(obj.profiles).forEach(key => {
      if (key.substring(0, 4) === 'mcm-') {
        if (!ProfilesManager.loadedProfiles.find(prof => key === `mcm-${prof.id}`)) {
          totalCount++;
        }
      }
    });

    if (totalCount) {
      ToastManager.createToast(
        'Warning',
        `There are ${totalCount} Minecraft Manager-related launcher profile(s) in your Minecraft installation that do not need to exist!`,
        'EXTRA-MINECRAFT-PROFILES'
      );
    }
  },
  checkMinecraftLibraries() {
    let totalCount = 0;
    fs.readdirSync(LibrariesManager.getMCMLibraries()).forEach(file => {
      if (file.substring(0, 4) === 'mcm-') {
        if (!ProfilesManager.loadedProfiles.find(prof => file === `mcm-${prof.id}`)) {
          totalCount++;
        }
      }
    });

    LibrariesManager.checkMissingLibraries();

    if (totalCount) {
      ToastManager.createToast(
        'Warning',
        `There are ${totalCount} Minecraft-Manager-related launcher libraries in your Minecraft installation that do not need to exist!`,
        'EXTRA-MINECRAFT-LIBRARIES'
      );
    }
  },
  parseVersionsJSON(versionsJSON) {
    this.ALL_VERSIONS = [];
    this.MC_VERSIONS = [];
    for (const ver of versionsJSON.versions) {
      this.ALL_VERSIONS.push(ver.id);
      if (ver.type === 'release') {
        this.MC_VERSIONS.push(ver.id);
      }
    }
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
    for (const profile of ProfilesManager.loadedProfiles) {
      fs.readdir(path.join(profile.gameDir, '/resourcepacks'), (err, files) => {
        if (files) {
          if (files.length !== profile.resourcepacks.length) {
            files.forEach(file => {
              const fullPath = path.join(profile.gameDir, `/resourcepacks/${file}`);
              const doesExist = profile.resourcepacks.find(
                rp => path.join(profile.gameDir, rp.getMainFile().path) === fullPath
              );
              if (!doesExist) {
                if (path.extname(file) === '.zip') {
                  const zip = new AdmZip(fullPath);
                  const entries = zip.getEntries();
                  let iconPath;
                  let description;
                  entries.forEach(entry => {
                    if (entry.entryName === 'pack.mcmeta') {
                      const parsed = JSON.parse(entry.getData().toString('utf8'));
                      if (parsed && parsed.pack) {
                        if (parsed.pack.description) {
                          description = parsed.pack.description;
                        }
                      }
                    }

                    if (entry.entryName === 'pack.png') {
                      fs.writeFileSync(
                        path.join(profile.profilePath, `/_mcm/icons/resourcepacks/${file}`),
                        entry.getData()
                      );
                      iconPath = `/_mcm/icons/resourcepacks/${file}`;
                    }
                  });

                  LogManager.log(
                    'info',
                    `[scan] {${profile.name}} Found resource pack ${file} which does not exist in subassets file. Adding it...`
                  );
                  profile.resourcepacks.push(
                    new GenericAsset({
                      icon: iconPath,
                      id: Global.createID(path.parse(file).name),
                      name: path.parse(file).name,
                      version: {
                        displayName: file,
                        minecraft: {
                          supportedVersions: ['unknown']
                        }
                      },
                      blurb: description,
                      description: `Imported from ${file}`,
                      hosts: {},
                      files: [
                        {
                          displayName: 'Main File',
                          type: 'resourcepackzip',
                          priority: 'mainFile',
                          path: `resourcepacks/${file}`
                        }
                      ],
                      dependencies: []
                    })
                  );
                  profile.save();
                }
              }
            });
          }
        }
      });

      profile.resourcepacks.forEach(rp => {
        if (!(rp instanceof GenericAsset)) {
          rp = new GenericAsset(rp);
        }

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
              const fullPath = path.join(profile.gameDir, `/mods/${file}`);
              const doesExist = profile.mods.find(
                mod => path.join(profile.gameDir, mod.getJARFile().path) === fullPath
              );
              if (!doesExist) {
                LogManager.log(
                  'info',
                  `[scan] {${profile.id}} Found mod file ${file} which does not exist in subassets file. Adding it...`
                );
                profile.mods.push(
                  new Mod({
                    icon: '',
                    id: Global.createID(path.parse(file).name),
                    name: path.parse(file).name,
                    version: {
                      displayName: file,
                      minecraft: {
                        supportedVersions: ['unknown']
                      }
                    },
                    blurb: `Imported from ${file}`,
                    description: `Imported from ${file}`,
                    hosts: {},
                    files: [
                      {
                        displayName: 'Main JAR File',
                        type: 'jar',
                        priority: 'mainFile',
                        path: `mods/${file}`
                      }
                    ],
                    dependencies: []
                  })
                );
                profile.save();
              }
            });
          }
        }
      });

      profile.mods.forEach(mod => {
        if (!(mod instanceof Mod)) {
          mod = new Mod(mod);
        }

        if (!fs.existsSync(path.join(profile.gameDir, mod.getJARFile().path))) {
          LogManager.log(
            'info',
            `[scan] {${profile.id}} Found mod ${mod.name} where the main file is missing. Removing it from the profile...`
          );
          profile.deleteSubAsset('mod', mod);
        }
      });
    }
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
  }
};

export default Global;
