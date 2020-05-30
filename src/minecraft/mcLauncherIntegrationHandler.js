import FSU from '../util/fsu';
import LauncherManager from '../manager/launcherManager';
import MCAccountsHandler from './mcAccountsHandler';
import ProfilesManager from '../manager/profilesManager';
import SettingsManager from '../manager/settingsManager';

const MCLauncherIntegrationHandler = {
  integrateAccounts() {
    return new Promise(async resolve => {
      const launcherProfiles = await FSU.readJSON(LauncherManager.getLauncherProfiles());
      if (launcherProfiles.authenticationDatabase) {
        await Promise.all(Object.keys(launcherProfiles.authenticationDatabase).map(authdName => {
          const authd = launcherProfiles.authenticationDatabase[authdName];
          const existing = MCAccountsHandler.getAccountByEmail(authd.username);
          if (!existing) {
            return MCAccountsHandler.addAccountLauncher(authd.username, authd.accessToken, Object.keys(authd.profiles)[0]);
          }

          return undefined;
        }));
      }

      resolve();
    });
  },
  integrateJava() {
    ProfilesManager.loadedProfiles.forEach(profile => {
      if (SettingsManager.currentSettings.java && SettingsManager.currentSettings.java.path) {
        let javaPath = SettingsManager.currentSettings.java.path;
        if (profile.mcm.java && profile.mcm.java.overridePath) {
          if (profile.mcm.java.manual) {
            javaPath = profile.mcm.java.manualPath;
          } else {
            javaPath = profile.mcm.java.path;
          }
        } else if (SettingsManager.currentSettings.java.manual) {
          javaPath = SettingsManager.currentSettings.java.manualPath;
        }
        LauncherManager.setProfileData(profile, 'javaDir', javaPath);
      }
    });
  },
  integrate() {
    this.integrateAccounts();
    this.integrateJava();
  }
};

export default MCLauncherIntegrationHandler;
