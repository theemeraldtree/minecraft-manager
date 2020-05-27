import fs from 'fs';
import os from 'os';
import path from 'path';
import { remote } from 'electron';
import LauncherManager from './launcherManager';
import logInit from '../util/logger';
import ToastManager from './toastManager';
import Global from '../util/global';

const logger = logInit('SettingsManager');

const { app } = remote;
const SettingsManager = {
  SETTINGS_PATH: path.join(app.getPath('userData'), '/settings.json'),
  MC_HOME: '',
  currentSettings: {},
  loadSettings() {
    return new Promise(async resolve => {
      logger.info('Loading settings...');
      if (!fs.existsSync(this.SETTINGS_PATH)) {
        logger.info("Settings don't exist");
        this.createSettings();
      }

      logger.info('Reading settings file...');
      fs.readFile(this.SETTINGS_PATH, (err, data) => {
        const parsed = JSON.parse(data);

        logger.info('Applying settings...');
        this.MC_HOME = parsed.homeDirectory;
        this.currentSettings = parsed;

        if (this.currentSettings.allowSnapshotProfile === undefined) {
          logger.info('Setting "allowSnapshotProfile" was missing. Adding it...');
          this.currentSettings.allowSnapshotProfile = false;
        }

        if (this.currentSettings.checkToastNews === undefined) {
          logger.info('Setting "checkToastNews" was missing. Adding it...');
          this.currentSettings.checkToastNews = true;
        }

        if (this.currentSettings.closeOnLaunch === undefined) {
          logger.info('Setting "closeOnLaunch" was missing. Adding it...');
          this.currentSettings.closeOnLaunch = false;
        }

        if (this.currentSettings.runSnapshotInSeperateFolder === undefined) {
          logger.info('Setting "runSnapshotInSeperateFolder" was missing. Adding it...');
          this.currentSettings.runSnapshotInSeperateFolder = false;
        }

        if (this.currentSettings.defaultsSyncOptionsTXT === undefined) {
          logger.info('Setting "defaultsSyncOptionsTXT" was missing. Adding it...');
          this.currentSettings.defaultsSyncOptionsTXT = false;
        }

        if (this.currentSettings.defaultsSyncOptionsOF === undefined) {
          logger.info('Setting "defaultsSyncOptionsOF" was missing. Adding it...');
          this.currentSettings.defaultsSyncOptionsOF = false;
        }

        if (this.currentSettings.defaultsSyncServers === undefined) {
          logger.info('Setting "defaultsSyncServers" was missing. Adding it...');
          this.currentSettings.defaultsSyncServers = false;
        }

        if (this.currentSettings.runLatestInIntegrated === undefined) {
          logger.info('Setting "runLatestInIntegrated" was missing. Adding it...');
          this.currentSettings.runLatestInIntegrated = false;
        }

        if (this.currentSettings.mcAccount === undefined) {
          logger.info('Setting "mcAccount" was missing. Adding it...');
          this.currentSettings.mcAccount = Object.keys(LauncherManager.getMCAccounts())[0];
        }

        if (this.currentSettings.java === undefined) {
          logger.info('Setting "java" was missing. Adding it...');
          this.currentSettings.java = {
            path: Global.getJavaPath()
          };
        }

        if (this.currentSettings.launcherIntegration === undefined) {
          logger.info('Setting "launcherIntegration" was missing. Adding it...');
          this.currentSettings.launcherIntegration = true;
        }

        if (this.currentSettings.analyticsEnabled === undefined && fs.existsSync(Global.PROFILES_PATH)) {
          logger.info('Showing analytics message');
          this.currentSettings.analyticsEnabled = true;
          ToastManager.createToast('Analytics', 'Minecraft Manager 2.4.3 includes new privacy-respecting analytics. If you want to turn them off, go to Settings');
          this.save();
        }

        logger.info('Finished loading settings');
        resolve();
      });
    });
  },
  save() {
    logger.info('Saving settings...');
    fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(this.currentSettings));
  },
  setHomeDirectory(homeDir) {
    logger.info(`Changing homeDirectory to ${homeDir}`);
    this.currentSettings.homeDirectory = homeDir;
    this.MC_HOME = homeDir;
    this.save();
  },
  setMCExe(exe) {
    logger.info(`Changing mcExe to ${exe}`);
    this.currentSettings.mcExe = exe;
    this.save();
  },
  setDedicatedRam(amount) {
    logger.info(`Changing dedicatedRam to ${amount}`);
    LauncherManager.setDedicatedRam(amount);
    this.currentSettings.dedicatedRam = amount;
    this.save();
  },
  setLastVersion(version) {
    logger.info(`Changing lastVersion to ${version}`);
    this.currentSettings.lastVersion = version;
    this.save();
  },
  setLastToastNewsID(id) {
    logger.info(`Changing lastToastNewsID to ${id}`);
    this.currentSettings.lastToastNewsID = id;
    this.save();
  },
  createSettings() {
    logger.info('Creating settings...');
    const totalRAM = Math.ceil(os.totalmem() / 1073741824);

    let dedicatedRam;
    if (totalRAM <= 2) {
      dedicatedRam = 1;
    } else if (totalRAM <= 4) {
      dedicatedRam = 2;
    } else if (totalRAM === 5) {
      dedicatedRam = 3;
    } else if (totalRAM <= 7) {
      dedicatedRam = 4;
    } else if (totalRAM <= 9) {
      dedicatedRam = 6;
    } else {
      dedicatedRam = 8;
    }

    logger.info(`Inferred RAM amount is ${dedicatedRam}`);

    const obj = {
      homeDirectory: '',
      dedicatedRam,
      mcExe: '',
      lastToastNewsID: -1,
      checkToastNews: true,
      closeOnLaunch: false,
      runSnapshotInSeperateFolder: false,
      defaultsSyncOptionsTXT: false,
      defaultsSyncOptionsOF: false,
      defaultsSyncServers: false,
      mcAccount: ''
    };

    logger.info('Saving new settings...');
    fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(obj));
  }
};

export default SettingsManager;
