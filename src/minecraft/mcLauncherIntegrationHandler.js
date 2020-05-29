import FSU from '../util/fsu';
import LauncherManager from '../manager/launcherManager';
import MCAccountsHandler from './mcAccountsHandler';

const MCLauncherIntegrationHandler = {
  async integrateAccounts() {
    const launcherProfiles = await FSU.readJSON(LauncherManager.getLauncherProfiles());
    if (launcherProfiles.authenticationDatabase) {
      Object.keys(launcherProfiles.authenticationDatabase).forEach(authdName => {
        const authd = launcherProfiles.authenticationDatabase[authdName];
        const existing = MCAccountsHandler.getAccountByEmail(authd.username);
        if (!existing) {
          MCAccountsHandler.addAccountLauncher(authd.username, authd.accessToken, Object.keys(authd.profiles)[0]);
        }
      });
    }
  },
  integrate() {
    this.integrateAccounts();
  }
};

export default MCLauncherIntegrationHandler;
