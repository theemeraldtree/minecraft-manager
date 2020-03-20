import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import Profile from '../type/profile';
import Global from '../util/global';

const LatestProfile = new Profile({
  type: 'profile',
  id: '0-default-profile-latest',
  name: 'Latest release',
  icon: path.join(Global.getResourcesPath(), '/icon-latest.png'),
  blurb: 'The Latest Version of Minecraft',
  description: 'The Latest Version of Minecraft',
  omafVersion: '1.0.0',
  isDefaultProfile: true,
  version: {
    displayName: 'Latest',
    timestamp: 0,
    minecraft: {
      version: 'latest-release'
    }
  }
});

function loadLatestProfile() {
  LatestProfile.loadSubAssets(true);

  LatestProfile.iconPath = path.join(Global.getResourcesPath(), 'icon-latest.png');
  LatestProfile.addIconToLauncher = () => {};

  LatestProfile.gameDir = Global.getMCPath();

  if (!fs.existsSync(LatestProfile.profilePath)) {
    fs.mkdirSync(LatestProfile.profilePath);
  }

  if (!fs.existsSync(LatestProfile.subAssetsPath)) {
    mkdirp.sync(LatestProfile.subAssetsPath);
  }

  if (!fs.existsSync(path.join(LatestProfile.profilePath, '/_mcm/icons/resourcepacks'))) {
    mkdirp.sync(path.join(LatestProfile.profilePath, '/_mcm/icons/resourcepacks'));
  }

  if (!fs.existsSync(path.join(LatestProfile.profilePath, '/_mcm/icons/worlds'))) {
    mkdirp.sync(path.join(LatestProfile.profilePath, '/_mcm/icons/worlds'));
  }

  LatestProfile.version.minecraft.version = Global.MC_VERSIONS[0];
  LatestProfile.minecraftVersion = Global.MC_VERSIONS[0];

  LatestProfile.save();
}

export { loadLatestProfile };
export default LatestProfile;
