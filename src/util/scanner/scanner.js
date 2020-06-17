import pMap from 'p-map';
import mods from './mods';
import worlds from './worlds';
import datapacks from './datapacks';
import resourcepacks from './resourcepacks';
import ProfilesManager from '../../manager/profilesManager';

const Scanner = {
  mods,
  worlds,
  resourcepacks,
  datapacks,
  scanProfile(profile) {
    return new Promise(async resolve => {
      const changedMods = await this.mods.scanProfile(profile);
      const changedWorlds = await this.worlds.scanProfile(profile);
      const changedDatapacks = await this.datapacks.scanProfile(profile);

      if (changedMods || changedWorlds || changedDatapacks) profile.save();

      ProfilesManager.updateProfile(profile);

      resolve();
    });
  },
  scanProfiles() {
    return pMap(ProfilesManager.loadedProfiles, profile => this.scanProfile(profile), {
      concurrency: 30
    });
  }
};

export default Scanner;
