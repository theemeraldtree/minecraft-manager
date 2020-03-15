import path from 'path';
import Profile from '../type/profile';
import Global from '../util/global';

const LatestProfile = new Profile({
  type: 'profile',
  id: 'mcm-latest-def-profile',
  name: 'Latest',
  icon: path.join(Global.getResourcesPath(), '/icon-latest.png'),
  blurb: 'The Latest Version of Minecraft',
  description: 'The Latest Version of Minecraft',
  omafVersion: '1.0.0',
  isDefaultProfile: true,
  version: {
    displayName: 'latest',
    timestamp: 0,
    minecraft: {
      version: 'latest'
    }
  }
});

LatestProfile.iconPath = path.join(Global.getResourcesPath(), 'icon-latest.png');

export default LatestProfile;
