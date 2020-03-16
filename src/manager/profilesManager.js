import Global from '../util/global';
import LogManager from './logManager';
import Profile from '../type/profile';
import LauncherManager from './launcherManager';
import LibrariesManager from './librariesManager';
import VersionsManager from './versionsManager';
import DownloadsManager from './downloadsManager';
import ToastManager from './toastManager';
import Hosts from '../host/Hosts';
import ErrorManager from './errorManager';
import ForgeFramework from '../framework/forge/forgeFramework';
import FabricFramework from '../framework/fabric/fabricFramework';
import LatestProfile from '../defaulltProfiles/latestProfile';
import SnapshotProfile from '../defaulltProfiles/snapshotProfile';
import SettingsManager from './settingsManager';

const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const ADMZip = require('adm-zip');

const ProfilesManager = {
  loadedProfiles: [],
  reloadListeners: [],
  previouslyRemovedProfiles: [],
  profilesBeingInstalled: [],
  progressState: {},
  getProfiles() {
    this.loadedProfiles = [LatestProfile];

    if (SettingsManager.currentSettings.allowSnapshotProfile) {
      this.loadedProfiles.push(SnapshotProfile);
    }
    LogManager.log('info', '[ProfilesManager] Getting profiles...');
    return new Promise(resolve => {
      if (fs.existsSync(Global.PROFILES_PATH)) {
        fs.readdir(Global.PROFILES_PATH, (err, files) => {
          if (files.length >= 1) {
            files.forEach(async file => {
              if (file !== '0-default-profile-latest' && file !== '0-default-profile-snapshot') {
                await this.processProfileFolder(path.join(Global.PROFILES_PATH + file));
              }

              this.updateReloadListeners();
              resolve();
            });
          } else {
            LogManager.log('info', '[ProfilesManager] done getting profiles');
            this.updateReloadListeners();
            resolve();
          }
        });
      } else {
        this.loadedProfiles = [LatestProfile, SnapshotProfile];

        if (SettingsManager.currentSettings.allowSnapshotProfile) {
          this.loadedProfiles.push(SnapshotProfile);
        }

        resolve();
      }
    });
  },
  updateReloadListeners() {
    Global.updateCache();
    this.reloadListeners.forEach(listener => listener());
  },
  registerReloadListener(listener) {
    LogManager.log('info', '[ProfilesManager] Registering reload listener');
    this.reloadListeners.push(listener);
  },
  unregisterReloadListener(listener) {
    LogManager.log('info', '[ProfilesManager] Unregistering reload listener');
    this.reloadListeners.splice(this.reloadListeners.indexOf(listener), 1);
  },
  updateProfile(newProfile) {
    LogManager.log('info', `[ProfilesManager] Updating profile ${newProfile.id}`);
    const oldProfile = this.loadedProfiles.findIndex(item => item.id === newProfile.id);
    this.loadedProfiles[oldProfile] = newProfile;
    this.updateReloadListeners();
  },
  createBackup(profile) {
    if (!fs.existsSync(Global.BACKUPS_DIR)) {
      fs.mkdirSync(Global.BACKUPS_DIR);
    }
    Global.copyDirSync(profile.gameDir, path.join(Global.BACKUPS_DIR, `${profile.id}-${new Date().getTime()}`));
  },
  importProfile(profilePath, stateChange) {
    return new Promise(resolve => {
      const zip = new ADMZip(profilePath);

      stateChange('Extracting...');
      const extractPath = path.join(Global.MCM_TEMP, `profileimport-${new Date().getTime()}`);
      zip.extractAllTo(extractPath, true);
      LogManager.log('info', `[ProfilesManager] (ProfileImport) Extracting profile from ${extractPath}`);

      stateChange('Copying...');
      LogManager.log(
        'info',
        `[ProfilesManager] (ProfileImport) Reading profile json file from ${path.join(extractPath, '/profile.json')}`
      );
      const obj = JSON.parse(fs.readFileSync(path.join(extractPath, '/profile.json')));
      const profPath = path.join(Global.PROFILES_PATH, `/${obj.id}/`);
      LogManager.log(
        'info',
        `[ProfilesManager] (ProfileImport) Copying profile from ${path.join(extractPath)} to ${profPath}`
      );

      if (fs.existsSync(profPath)) {
        throw new Error(`There is already a profile with the name: ${obj.name}`);
      }
      fs.mkdirSync(path.join(extractPath, '/_mcm'));
      fs.mkdirSync(path.join(extractPath, '/_mcm/icons'));
      fs.mkdirSync(path.join(extractPath, '/_mcm/icons/mods'));

      Global.copyDirSync(extractPath, profPath);

      stateChange('Reloading profiles...');
      LogManager.log('info', '[ProfilesManager] (ProfileImport) Reloading profiles');
      this.getProfiles().then(() => {
        const profile = this.getProfileFromID(obj.id);
        profile.state = 'importing...';

        const importComplete = () => {
          profile.state = '';

          LogManager.log('info', `[ProfilesManager] (ProfileImport) Updating profile for ${profile.id}`);
          ProfilesManager.updateProfile(profile);

          LogManager.log('info', `[ProfilesManager] (ProfileImport) Removing extract path from ${profile.id}`);
          rimraf.sync(extractPath);

          LogManager.log('info', `[ProfilesManager] (ProfileImport) Completed import for ${profile.id}`);
          stateChange('Done');

          profile.addIconToLauncher();
          resolve();
        };

        if (profile.mods) {
          LogManager.log('info', `[ProfilesManager] (ProfileImport) Starting mod download for ${profile.id}`);
          stateChange('Downloading mods...');
          const curseModsToDownload = profile.mods.map(modT => {
            const mod = modT;
            if (mod.hosts) {
              if (mod.hosts.curse) {
                LogManager.log('info', `[ProfilesManager] (ProfileImport) Adding mod to download queue ${mod.id}`);
                mod.cachedID = `profile-import-${mod.id}`;
                mod.detailedInfo = false;
                Hosts.cache.assets[mod.cachedID] = mod;
                curseModsToDownload.push(mod);
              }
            }

            return undefined;
          });

          LogManager.log('info', `[ProfilesManager] (ProfileImport) Creating progressive download for ${profile.id}`);
          DownloadsManager.createProgressiveDownload(`Mods from ${profile.name}`).then(download => {
            let numberDownloaded = 0;

            const concurrent = curseModsToDownload.length >= 5 ? 5 : 0;
            Hosts.downloadModList(
              'curse',
              profile,
              curseModsToDownload.slice(),
              () => {
                if (numberDownloaded === curseModsToDownload.length) {
                  DownloadsManager.removeDownload(download.name);
                  stateChange('Creating launcher profile...');
                  LogManager.log(
                    'info',
                    `[ProfilesManager] (ProfileImport) Creating launcher profile for ${profile.id}`
                  );
                  LauncherManager.createProfile(profile);
                  if (profile.frameworks.forge) {
                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Installing Forge for ${profile.id}`);
                    stateChange('Installing Forge...');
                    ForgeFramework.setupForge(profile).then(() => {
                      importComplete();
                    });
                  } else if (profile.frameworks.fabric) {
                    LogManager.log('info', `[ProfilesManager] (ProfileImport) Installing Fabric for ${profile.id}`);
                    stateChange('Installing Fabric...');
                    FabricFramework.setupFabric(profile).then(() => {
                      importComplete();
                    });
                  } else {
                    importComplete();
                  }
                }
              },
              () => {
                numberDownloaded++;
                DownloadsManager.setDownloadProgress(
                  download.name,
                  Math.ceil((numberDownloaded / curseModsToDownload.length) * 100)
                );
              },
              concurrent
            );
          });
        } else {
          stateChange('Creating launcher profile...');
          LogManager.log('info', `[ProfilesManager] (ProfileImport) Creating launcher profile for ${profile.id}`);
          LauncherManager.createProfile(profile);
          importComplete();
        }
      });
    });
  },
  async processProfileFolder(location) {
    LogManager.log('info', `[ProfilesManager] Processing profile folder at ${location}`);
    const profilePath = path.join(location, '/profile.json');
    if (fs.existsSync(profilePath)) {
      let rawOMAF;
      try {
        rawOMAF = JSON.parse(fs.readFileSync(profilePath));
      } catch (e) {
        ToastManager.createToast(
          'Warning',
          `The '${path.basename(location)}' profile has a corrupted/malformed JSON info file! That's no good!`,
          'OMAF-PROFILE-MALFORMED-JSON'
        );
      }
      if (rawOMAF) {
        rawOMAF.fpath = location;
        rawOMAF.installed = true;
        LogManager.log('info', `[ProfilesManager] Loading profile at ${location}`);
        const profile = new Profile(rawOMAF);
        this.loadedProfiles.push(profile);

        let progvar = 'installed';
        let version = profile.version.displayName;
        if (this.progressState) {
          if (this.progressState[profile.id]) {
            if (this.progressState[profile.id] !== 'installed') {
              progvar = this.progressState[profile.id].progress;
              version = this.progressState[profile.id].version;
            }
          }
        }
        this.progressState[profile.id] = {
          progress: progvar,
          version
        };
      }
    } else {
      ToastManager.createToast(
        'Warning',
        `In your profiles folder, the '${path.basename(location)}' folder is missing the essential profile.json file!`,
        'OMAF-PROFILE-MISSING-JSON'
      );
    }
  },

  getProfileFromID(id) {
    return this.loadedProfiles.find(prof => prof.id === id);
  },

  containsProfileWithName(name) {
    const foundProfile = this.loadedProfiles.find(profile => profile.name.toLowerCase() === name.toLowerCase());
    if (foundProfile) return true;

    return false;
  },

  createProfile(name, mcversion) {
    LogManager.log('info', '[ProfilesManager] (CreateProfile) Starting profile creation...');
    const id = Global.createID(name);
    return new Promise(resolve => {
      LogManager.log('info', '[ProfilesManager] (CreateProfile) Creating profile directories');
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/files'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm/icons'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm/icons/mods'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm/icons/resourcepacks'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm/icons/worlds'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_omaf'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_omaf/subAssets'));

      LogManager.log('info', '[ProfilesManager] Copying default logo to profile');
      const profile = new Profile({
        type: 'profile',
        id,
        name,
        icon: 'icon.png',
        omafVersion: Global.OMAF_VERSION,
        description: 'Minecraft Manager Profile',
        blurb: 'Minecraft Manager Profile',
        version: {
          displayName: '1.0.0',
          timestamp: new Date().getTime(),
          minecraft: {
            version: mcversion
          }
        }
      });

      profile.resetIcon();

      profile.applyDefaults();

      LogManager.log('info', '[ProfilesManager] (CreateProfile) Creating launcher profile');
      LauncherManager.createProfile(profile);

      LogManager.log('info', '[ProfilesManager] (CreateProfile) Saving profile');
      profile.save().then(() => {
        this.loadedProfiles = [];

        LogManager.log('info', '[ProfilesManager] (CreateProfile) Reloading profiles');
        this.getProfiles().then(() => {
          LogManager.log('info', `[ProfilesManager] (CreateProfile) Completed profile creation for ${profile.id}`);
          resolve(profile);
        });
      });
    });
  },

  deleteProfile(profile) {
    this.previouslyRemovedProfiles.push(profile);
    if (this.progressState[profile.id]) {
      delete this.progressState[profile.id];
    }
    LogManager.log('info', `[ProfilesManager] (DeleteProfile) Starting profile deletion for ${profile.id}`);
    return new Promise(resolve => {
      LogManager.log('info', `[ProfilesManager] (DeleteProfile) Deleting launcher profile for ${profile.id}`);
      LauncherManager.deleteProfile(profile);

      LogManager.log('info', `[ProfilesManager] (DeleteProfile) Removing profile folder from ${profile.id}`);
      rimraf(profile.profilePath, err => {
        if (err) {
          ToastManager.createToast('Error', `Error deleting profile: ${ErrorManager.makeReadable(err)}`);
          return;
        }
        LogManager.log('info', `[ProfilesManager] (DeleteProfile) Removing library from ${profile.id}`);
        LibrariesManager.deleteLibrary(profile).then(() => {
          LogManager.log('info', `[ProfilesManager] (DeleteProfile) Removing version from ${profile.id}`);
          VersionsManager.deleteVersion(profile).then(() => {
            this.loadedProfiles = [];
            LogManager.log('info', '[ProfilesManager] (DeleteProfile) Reloading profiles');
            this.getProfiles().then(() => {
              this.loadedProfiles.forEach(prof => {
                // removes weird backups that can happen when the app crashes/is closed during a profile update
                if (prof.id === profile.id && !this.previouslyRemovedProfiles.includes(prof)) {
                  this.deleteProfile(prof);
                }
              });
              LogManager.log('info', '[ProfilesManager] (DeleteProfile) Done');
              resolve();
            });
          });
        });
      });
    });
  }
};

export default ProfilesManager;
