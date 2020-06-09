import Global from '../util/global';
import Profile from '../type/profile';
import LauncherManager from './launcherManager';
import LibrariesManager from './librariesManager';
import VersionsManager from './versionsManager';
import ToastManager from './toastManager';
import ErrorManager from './errorManager';
import ForgeFramework from '../framework/forge/forgeFramework';
import FabricFramework from '../framework/fabric/fabricFramework';
import LatestProfile from '../defaultProfiles/latestProfile';
import SnapshotProfile from '../defaultProfiles/snapshotProfile';
import SettingsManager from './settingsManager';
import logInit from '../util/logger';
import MCVersionHandler from '../minecraft/mcVersionHandler';
import Downloader from '../util/downloader';

const logger = logInit('ProfilesManager');

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
    logger.info('Loading profiles...');
    this.loadedProfiles = [LatestProfile];

    if (SettingsManager.currentSettings.allowSnapshotProfile) {
      logger.info('Adding snapshot profile...');
      this.loadedProfiles.push(SnapshotProfile);
    }

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
            logger.info('Finished loading profiles');
            this.updateReloadListeners();
            resolve();
          }
        });
      } else {
        logger.info('Profiles Path does not exist');
        this.loadedProfiles = [LatestProfile];

        if (SettingsManager.currentSettings.allowSnapshotProfile) {
          logger.info('Adding snapshot profile...');
          this.loadedProfiles.push(SnapshotProfile);
        }

        resolve();
      }
    });
  },
  updateReloadListeners() {
    this.reloadListeners.forEach(listener => listener());
  },
  registerReloadListener(listener) {
    logger.info('Registering reload listener...');
    this.reloadListeners.push(listener);
  },
  unregisterReloadListener(listener) {
    logger.info('Unregistering reload listener...');
    this.reloadListeners.splice(this.reloadListeners.indexOf(listener), 1);
  },
  updateProfile(newProfile) {
    logger.info(`Updating profile ${newProfile.id}`);

    const oldProfile = this.loadedProfiles.findIndex(item => item.id === newProfile.id);
    this.loadedProfiles[oldProfile] = newProfile;
    this.updateReloadListeners();
  },
  createBackup(profile) {
    logger.info(`Creating backup of ${profile.id}`);
    if (!fs.existsSync(Global.BACKUPS_DIR)) {
      fs.mkdirSync(Global.BACKUPS_DIR);
    }
    Global.copyDirSync(profile.gameDir, path.join(Global.BACKUPS_DIR, `${profile.id}-${new Date().getTime()}`));
  },
  importProfile(profilePath, stateChange) {
    logger.info(`(ProfileImport) Importing profile from ${profilePath}`);
    return new Promise(resolve => {
      const zip = new ADMZip(profilePath);

      stateChange('Extracting...');
      const extractPath = path.join(Global.MCM_TEMP, `profileimport-${new Date().getTime()}`);
      zip.extractAllTo(extractPath, true);

      logger.info('(ProfileImport) Extracting profile...');

      stateChange('Copying...');

      logger.info(`(ProfileImport) Reading profile json file from ${path.join(extractPath, '/profile.json')}`);

      if (!fs.existsSync(path.join(extractPath, '/profile.json'))) {
        logger.error('(ProfileImport) Importing profile is missing profile.json');
        throw new Error('The profile is missing the essential profile.json file. It may be a corrupted file.');
      }

      const obj = JSON.parse(fs.readFileSync(path.join(extractPath, '/profile.json')));
      const profPath = path.join(Global.PROFILES_PATH, `/${obj.id}/`);

      logger.info(`(ProfileImport) Copying profile from ${extractPath} to ${profPath}`);

      if (fs.existsSync(profPath)) {
        logger.info(`(ProfileImport) Duplicate profile found during import. Name of ${obj.name}`);
        throw new Error(`there is already a profile with the name ${obj.name}`);
      }

      logger.info('(ProfileImport) Creating MCM-specific directories...');
      fs.mkdirSync(path.join(extractPath, '/_mcm'));
      fs.mkdirSync(path.join(extractPath, '/_mcm/icons'));
      fs.mkdirSync(path.join(extractPath, '/_mcm/icons/mods'));
      fs.mkdirSync(path.join(extractPath, '/_mcm/icons/resourcepacks'));
      fs.mkdirSync(path.join(extractPath, '/_mcm/icons/worlds'));

      Global.copyDirSync(extractPath, profPath);

      stateChange('Reloading profiles...');

      logger.info('(ProfileImport) Reloading profiles...');
      this.getProfiles().then(async () => {
        const profile = this.getProfileFromID(obj.id);
        profile.state = 'importing...';

        const importComplete = () => {
          profile.state = '';

          logger.info(`(ProfileImport) Updating profile ${profile.id}...`);
          ProfilesManager.updateProfile(profile);

          logger.info(`(ProfileImport) Removing extraction path from ${profile.id}...`);
          rimraf.sync(extractPath);

          logger.info(`(ProfileImport) Import Complete for ${profile.id}`);
          stateChange('Done');

          profile.addIconToLauncher();
          resolve();
        };

        if (profile.mods) {
          logger.info(`(ProfileImport) Starting mod download for ${profile.id}`);

          stateChange('Downloading mods...');
          await Downloader.downloadHostedAssets('curse', profile.mods, profile);

          if (SettingsManager.currentSettings.launcherIntegration) {
            stateChange('Creating launcher profile...');
            logger.info(`(ProfileImport) Creating Launcher profile for ${profile.id}`);

            LauncherManager.createProfile(profile);
          }

          if (profile.frameworks.forge) {
            logger.info(`(ProfileImport) Installing Forge for ${profile.id}`);
            stateChange('Installing Forge...');
            ForgeFramework.setupForge(profile).then(() => {
              importComplete();
            });
          } else if (profile.frameworks.fabric) {
            logger.info(`(ProfileImport) Installing Fabric for ${profile.id}`);

            stateChange('Installing Fabric...');
            FabricFramework.setupFabric(profile).then(() => {
              importComplete();
            });
          } else {
            logger.info(`(ProfileImport) Creating version JSON for ${profile.id}`);
            MCVersionHandler.updateProfile(profile, true);
            importComplete();
          }
        } else {
          if (SettingsManager.currentSettings.launcherIntegration) {
            stateChange('Creating launcher profile...');
            logger.info(`(ProfileImport) Creating launcher profile for ${profile.id}...`);

            LauncherManager.createProfile(profile);
          }

          importComplete();
        }
      });
    });
  },
  async processProfileFolder(location) {
    logger.info(`Processing profile folder at ${path.basename(location)}...`);

    const profilePath = path.join(location, '/profile.json');
    if (fs.existsSync(profilePath)) {
      let rawOMAF;
      try {
        rawOMAF = JSON.parse(fs.readFileSync(profilePath));
      } catch (e) {
        logger.error('Error reading profile folder json');
        logger.error(e.toString());

        ToastManager.createToast(
          'Warning',
          `The '${path.basename(location)}' profile has a corrupted/malformed JSON info file! That's not good!`,
          'OMAF-PROFILE-MALFORMED-JSON'
        );
      }
      if (rawOMAF) {
        rawOMAF.fpath = location;
        rawOMAF.installed = true;

        logger.info(`Loading profile at ${path.basename(location)}...`);

        const profile = new Profile(rawOMAF);
        this.loadedProfiles.push(profile);

        let progvar = 'installed';
        let version = profile.version.displayName;

        logger.info(`Assigning progress states for ${profile.id}`);
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
      logger.error(`Profile at ${path.basename(location)} is missing profile.json`);
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
    logger.info('Starting profile creation...');

    const id = Global.createID(name);
    return new Promise(resolve => {
      logger.info('Creating directories for new profile...');

      fs.mkdirSync(path.join(Global.PROFILES_PATH, id));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/files'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm/binaries'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm/version'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm/icons'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm/icons/mods'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm/icons/resourcepacks'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_mcm/icons/worlds'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_omaf'));
      fs.mkdirSync(path.join(Global.PROFILES_PATH, id, '/_omaf/subAssets'));

      logger.info('Initializing new profile...');

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

      logger.info('Copying default logo to new profile...');

      profile.resetIcon();

      profile.applyDefaults();

      if (SettingsManager.currentSettings.launcherIntegration) {
      logger.info(`Creating launcher profile for ${profile.id}`);
      LauncherManager.createProfile(profile);
      }

      logger.info(`Saving new profile ${profile.id}`);

      profile.save().then(() => {
        this.loadedProfiles = [];

        logger.info('Reloading profiles...');
        this.getProfiles().then(() => {
          logger.info(`Finished creating new profile ${profile.id}`);
          resolve(profile);
        });
      });
    });
  },

  deleteProfile(profileT) {
    const profile = profileT;
    logger.info(`Starting deletion of profile ${profile.id}`);

    this.previouslyRemovedProfiles.push(profile);
    if (this.progressState[profile.id]) {
      logger.info(`Removing progressState for ${profile.id}`);
      delete this.progressState[profile.id];
    }

    profile.state = 'Deleting...';
    this.updateProfile(profile);

    return new Promise(resolve => {
      if (SettingsManager.currentSettings.launcherIntegration) {
        logger.info(`Deleting launcher profile for ${profile.id}`);
        LauncherManager.deleteProfile(profile);
      }

      logger.info(`Removing profile folder for ${profile.id}`);
      rimraf(profile.profilePath, err => {
        if (err) {
          logger.error(`Error deleting profile ${profile.id}`);
          logger.error(err.toString());
          ToastManager.createToast('Error', `Error deleting profile: ${ErrorManager.makeReadable(err)}`);
          return;
        }

        logger.info(`Removing libraries for ${profile.id}`);

        LibrariesManager.deleteLibrary(profile).then(() => {
          logger.info(`Removing MC version for ${profile.id}`);

          VersionsManager.deleteVersion(profile).then(() => {
            this.loadedProfiles = [];

            logger.info('Reloading profiles...');
            this.getProfiles().then(() => {
              this.loadedProfiles.forEach(prof => {
                // removes weird backups that can happen when the app crashes/is closed during a profile update
                if (prof.id === profile.id && !this.previouslyRemovedProfiles.includes(prof)) {
                  logger.info('Found duplicate profiles with same name during profile deletion');
                  this.deleteProfile(prof);
                }
              });

              logger.info(`Finished deleting profile ${profile.id}`);
              resolve();
            });
          });
        });
      });
    });
  }
};

export default ProfilesManager;
