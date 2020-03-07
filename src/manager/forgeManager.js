import VersionsManager from './versionsManager';
import LibrariesManager from './librariesManager';
import HTTPRequest from '../host/httprequest';
import LauncherManager from './launcherManager';

const ForgeManager = {
  setupForge: (profile) => new Promise((resolve) => {
    VersionsManager.createVersion(profile, 'forge');
    LibrariesManager.createForgeLibrary(profile).then(() => {
      profile.setForgeInstalled(true);
      resolve();
    });
  }),
  uninstallForge: (profile) => new Promise((resolve) => {
    LibrariesManager.deleteLibrary(profile).then(() => {
      VersionsManager.deleteVersion(profile).then(() => {
        LauncherManager.setProfileData(profile, 'lastVersionId', profile.minecraftversion);
        profile.removeForge();
        resolve();
      });
    });
  }),
  getForgePromotions: () => new Promise((resolve) => {
    HTTPRequest.httpGet('https://files.minecraftforge.net/maven/net/minecraftforge/forge/promotions.json').then((promotions) => {
      resolve(promotions);
    });
  }),
};

export default ForgeManager;
