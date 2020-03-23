import fs from 'fs';
import os from 'os';
import path from 'path';
import { remote } from 'electron';
import LauncherManager from './launcherManager';

const { app } = remote;
const SettingsManager = {
  SETTINGS_PATH: path.join(app.getPath('userData'), '/settings.json'),
  MC_HOME: '',
  currentSettings: {},
  loadSettings() {
    return new Promise(async resolve => {
      if (!fs.existsSync(this.SETTINGS_PATH)) {
        this.createSettings();
      }

      fs.readFile(this.SETTINGS_PATH, (err, data) => {
        const parsed = JSON.parse(data);

        this.MC_HOME = parsed.homeDirectory;
        this.currentSettings = parsed;
        if (this.currentSettings.defaultsShowTutorial === undefined) {
          this.currentSettings.defaultsShowTutorial = false;
        }
        if (this.currentSettings.defaultsAutoJump === undefined) {
          this.currentSettings.defaultsAutoJump = false;
        }
        if (this.currentSettings.defaultsMultiplayerWarning === undefined) {
          this.currentSettings.defaultsMultiplayerWarning = false;
        }

        if (this.currentSettings.allowSnapshotProfile === undefined) {
          this.currentSettings.allowSnapshotProfile = false;
        }

        if (this.currentSettings.checkToastNews === undefined) {
          this.currentSettings.checkToastNews = true;
        }

        if (this.currentSettings.closeOnLaunch === undefined) {
          this.currentSettings.closeOnLaunch = false;
        }

        if (this.currentSettings.runSnapshotInSeperateFolder === undefined) {
          this.currentSettings.runSnapshotInSeperateFolder = true;
        }

        resolve();
      });
    });
  },
  save() {
    fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(this.currentSettings));
  },
  setHomeDirectory(homeDir) {
    this.currentSettings.homeDirectory = homeDir;
    this.MC_HOME = homeDir;
    this.save();
  },
  setMCExe(exe) {
    this.currentSettings.mcExe = exe;
    this.save();
  },
  setDedicatedRam(amount) {
    LauncherManager.setDedicatedRam(amount);
    this.currentSettings.dedicatedRam = amount;
    this.save();
  },
  setLastVersion(version) {
    this.currentSettings.lastVersion = version;
    this.save();
  },
  setLastToastNewsID(id) {
    this.currentSettings.lastToastNewsID = id;
    this.save();
  },
  createSettings() {
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

    const obj = {
      homeDirectory: '',
      dedicatedRam,
      mcExe: '',
      lastToastNewsID: -1,
      checkToastNews: true,
      closeOnLaunch: false,
      runSnapshotInSeperateFolder: true
    };

    fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(obj));
  }
};

export default SettingsManager;
