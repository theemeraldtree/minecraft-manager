import fs from 'fs';
import path from 'path';
import LauncherManager from './launcherManager';
import { remote } from 'electron';
const app = remote.app;
const SettingsManager = {
    SETTINGS_PATH: path.join(app.getPath('userData'), '/settings.json'),
    MC_HOME: '',
    currentSettings: {},
    loadSettings: function() {
        if(!fs.existsSync(this.SETTINGS_PATH)) {
            this.createSettings();
        }
        let parsed = JSON.parse(fs.readFileSync(this.SETTINGS_PATH));
        this.MC_HOME = parsed.homeDirectory;
        this.currentSettings = parsed;
    },
    save: function() {
        fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(this.currentSettings));
    },
    setHomeDirectory: function(homeDir) {
        this.currentSettings.homeDirectory = homeDir;
        this.MC_HOME = homeDir;
        this.save();
    },
    setDedicatedRam: function(amount) {
        LauncherManager.setDedicatedRam(amount);
        this.currentSettings.dedicatedRam = amount;
        this.save();
    },
    createSettings: function() {
        let obj = {
            homeDirectory: '',
            dedicatedRam: 2
        }

        fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(obj));
    }
}

export default SettingsManager;