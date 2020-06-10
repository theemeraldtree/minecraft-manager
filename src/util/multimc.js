import path from 'path';
import fs from 'fs';
import Global from './global';
import FSU from './fsu';
import ForgeFramework from '../framework/forge/forgeFramework';
import FabricFramework from '../framework/fabric/fabricFramework';
import ProfilesManager from '../manager/profilesManager';
import logInit from './logger';

const AdmZip = require('adm-zip');

const logger = logInit('MultiMC-Compat');

/**
 * MultiMC-Format Importer/Exporter Utility
 */
const MultiMC = {
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
      zip.extractAllToAsync(extractPath, true, () => {
        fs.readdir(extractPath, (err, files) => {
          files.forEach(async dir => {
            const dirPath = path.join(extractPath, dir);

            updateState('Reading mmc-pack.json');
            const json = FSU.readJSONSync(path.join(dirPath, 'mmc-pack.json'));

            let framework, frameworkVersion, minecraftVersion;

            updateState('Finding Minecraft Version...');
            const minecraftComponent = json.components.find(component => component.uid === 'net.minecraft');
            if (minecraftComponent) {
              minecraftVersion = minecraftComponent.version;
            } else {
              logger.error('[Import] Missing Minecraft Version');
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
            const cfg = fs.readFileSync(path.join(dirPath, 'instance.cfg')).toString();
            const cfgSplit = cfg.split('\n').map(c => c.split('='));

            updateState('Finding name...');
            const name = cfgSplit.find(c => c[0].toLowerCase() === 'name')[1];

            updateState('Finding notes...');
            const notes = cfgSplit.find(c => c[0].toLowerCase() === 'notes')[1];

            updateState('Finding icon key...');
            const iconKey = cfgSplit.find(c => c[0].toLowerCase() === 'iconkey')[1];

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

            profile.blurb = 'Imported from MultiMC zip';

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
      });
    });
  }
};

export default MultiMC;
