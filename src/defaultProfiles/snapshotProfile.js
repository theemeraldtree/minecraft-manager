import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import Profile from '../type/profile';
import Global from '../util/global';
import SettingsManager from '../manager/settingsManager';
import LatestProfile from './latestProfile';

const SnapshotProfile = new Profile({
  type: 'profile',
  id: '0-default-profile-snapshot',
  name: 'Latest snapshot',
  icon: path.join(Global.getResourcesPath(), '/icon-snapshot.png'),
  blurb: 'The Latest Snapshot Version of Minecraft',
  description: 'The Latest Snapshot Version of Minecraft. May be unstable!',
  omafVersion: '1.0.0',
  isDefaultProfile: true,
  version: {
    displayName: 'Snapshot',
    timestamp: 0,
    minecraft: {
      version: Global.MC_VERSIONS[0]
    }
  }
});

function loadSnapshotProfile() {
  SnapshotProfile.loadSubAssets(true);

  SnapshotProfile.iconPath = path.join(Global.getResourcesPath(), 'icon-snapshot.png');
  SnapshotProfile.addIconToLauncher = () => {};

  if (!fs.existsSync(SnapshotProfile.profilePath)) {
    fs.mkdirSync(SnapshotProfile.profilePath);
  }

  if (!fs.existsSync(SnapshotProfile.subAssetsPath)) {
    mkdirp.sync(SnapshotProfile.subAssetsPath);
  }

  if (!fs.existsSync(path.join(SnapshotProfile.profilePath, '/_mcm/icons/resourcepacks'))) {
    mkdirp.sync(path.join(SnapshotProfile.profilePath, '/_mcm/icons/resourcepacks'));
  }

  if (!fs.existsSync(path.join(SnapshotProfile.profilePath, '/_mcm/icons/worlds'))) {
    mkdirp.sync(path.join(SnapshotProfile.profilePath, '/_mcm/icons/worlds'));
  }

  if (!fs.existsSync(SnapshotProfile.gameDir)) {
    mkdirp.sync(SnapshotProfile.gameDir);
  }

  SnapshotProfile.version.minecraft.version = Global.ALL_VERSIONS[0];
  SnapshotProfile.minecraftVersion = Global.ALL_VERSIONS[0];

  if (!SettingsManager.currentSettings.runSnapshotInSeperateFolder) {
    SnapshotProfile.worlds = LatestProfile.worlds;
    SnapshotProfile.resourcespacks = LatestProfile.resourcepacks;
    SnapshotProfile.gameDir = LatestProfile.gameDir;
  }
}

export { loadSnapshotProfile };
export default SnapshotProfile;
