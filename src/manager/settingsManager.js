import fs from 'fs';
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
        if (!this.currentSettings.defaultsShowTutorial) {
          this.currentSettings.defaultsShowTutorial = false;
        }
        if (!this.currentSettings.defaultsAutoJump) {
          this.currentSettings.defaultsAutoJump = false;
        }
        if (!this.currentSettings.defaultsMultiplayerWarning) {
          this.currentSettings.defaultsMultiplayerWarning = false;
        }

        if (!this.currentSettings.allowSnapshotProfile) {
          this.currentSettings.allowSnapshotProfile = false;
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
    const obj = {
      homeDirectory: '',
      dedicatedRam: 2,
      mcExe: '',
      lastToastNewsID: -1
    };

    fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(obj));
  }
};

export default SettingsManager;
