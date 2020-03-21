import path from 'path';
import fs from 'fs';
import Global from './global';
import FSU from './fsu';
import LogManager from '../manager/logManager';
import ForgeFramework from '../framework/forge/forgeFramework';
import FabricFramework from '../framework/fabric/fabricFramework';
import ProfilesManager from '../manager/profilesManager';

/* eslint-disable */
const AdmZip = require('adm-zip');

/**
 * MultiMC-Format Importer/Exporter Utility
 */
const MultiMC = {
  /**
   * Exports the profile to a MultiMC-format ZIP
   * @param {Object} profile - The profile you want to export
   * @param {string} dest - The destination of the ZIP
   */
  export(profile, dest) {},
  /**
   * Import a MultiMC-format ZIP
   * @param {string} zipPath - The path of the ZIP that's being imported
   * @param {function} updateState - Called when anything happens, used to show info to user
   */
  import(zipPath, updateState) {
    return new Promise(async resolve => {
      const zip = new AdmZip(zipPath);

      updateState('Extracting...');
      const extractPath = path.join(Global.MCM_TEMP, `mmc-profileimport-${new Date().getTime()}`);
      zip.extractAllTo(extractPath, true);

      fs.readdirSync(extractPath).forEach(async dir => {
        const dirPath = path.join(extractPath, dir);

        updateState('Reading mmc-pack.json');
        const json = FSU.readJSONSync(path.join(dirPath, 'mmc-pack.json'));

        let framework, frameworkVersion, minecraftVersion;

        updateState('Finding Minecraft Version...');
        const minecraftComponent = json.components.find(component => component.uid === 'net.minecraft');
        if (minecraftComponent) {
          minecraftVersion = minecraftComponent.version;
        } else {
          LogManager.log('severe', `[MultiMC-Import] Missing Minecraft Version`);
          return;
        }

        updateState('Looking for frameworks...');
        const netfabricmcComponent = json.components.find(component => component.uid === 'net.fabricmc');
        if (netfabricmcComponent) {
          framework = 'fabric';
          frameworkVersion = netfabricmcComponent.cachedVersion.split('yarn-')[1];
        }

        const netfabricloaderComponent = json.components.find(
          component => component.uid === 'net.fabricmc.fabric-loader'
        );
        if (netfabricloaderComponent && !framework) {
          framework = 'fabric';
          frameworkVersion = netfabricloaderComponent.version;
        }

        const netminecraftforgeComponent = json.components.find(component => component.uid === 'net.minecraftforge');
        if (netminecraftforgeComponent && !framework) {
          framework = 'forge';
          frameworkVersion = `${minecraftVersion}-${netminecraftforgeComponent.version}`;
        }

        updateState('Reading instance.cfg');
        let cfg = fs.readFileSync(path.join(dirPath, 'instance.cfg')).toString();
        let cfgSplit = cfg.split('\n').map(c => c.split('='));

        updateState('Finding name...');
        let name = cfgSplit.find(c => c[0].toLowerCase() === 'name')[1];

        updateState('Finding notes...');
        let notes = cfgSplit.find(c => c[0].toLowerCase() === 'notes')[1];

        updateState('Finding icon key...');
        let iconKey = cfgSplit.find(c => c[0].toLowerCase() === 'iconkey')[1];

        const profile = await ProfilesManager.createProfile(name, minecraftVersion);

        let iconFile;
        if (iconKey) {
          updateState('Finding icon file...');
          iconFile = fs.readdirSync(dirPath).find(file => file.substring(0, file.lastIndexOf('.')) === iconKey);
        }

        if (iconFile) {
          updateState('Copying icon file...');
          fs.copyFileSync(path.join(dirPath, iconFile), path.join(profile.profilePath, path.basename(iconFile)));
          profile.icon = path.basename(iconFile);
          profile.iconPath = path.join(profile.profilePath, path.basename(iconFile));
        }

        if (notes) {
          profile.description = notes;
        }

        profile.blurb = `Imported from MultiMC zip`;

        updateState('Copying .minecraft contents...');
        fs.readdirSync(path.join(dirPath, '.minecraft')).forEach(file => {
          Global.copyDirSync(path.join(dirPath, '.minecraft', file), path.join(profile.gameDir, file));
        });

        if (framework === 'forge') {
          profile.frameworks = {
            forge: {
              version: frameworkVersion
            }
          };
          profile.save();

          updateState('Installing Forge...');
          ForgeFramework.setupForge(profile);
        } else if (framework === 'fabric') {
          profile.frameworks = {
            fabric: {
              version: frameworkVersion
            }
          };
          profile.save();

          updateState('Installing Fabric...');
          FabricFramework.setupFabric(profile);
        }

        updateState('Scanning for sub-assets...');
        Global.scanProfile(profile);

        updateState('Finishing up...');
        ProfilesManager.updateProfile(profile);

        resolve();
      });
    });
  }
};

export default MultiMC;
