import path from 'path';
import fs from 'fs';
import ADMZip from 'adm-zip';
import logInit from '../logger';
import Global from '../global';
import OMAFFileAsset from '../../type/omafFileAsset';

const logger = logInit('ScanResourcePacks');

const ResourcePacks = {
  scanResourcePack(profile, filePath) {
    return new Promise(async resolve => {
      logger.info(`Scanning "${filePath}" for "${profile.id}"`);

      const fileName = path.basename(filePath);

      let icon, iconPath;
      let description = '';
      let mcmeta, iconData;

      if (path.extname(filePath) === '.zip') {
        // zipped, not a folder
        const zip = new ADMZip(filePath);
        const entries = zip.getEntries();

        entries.forEach(entry => {
          // Look for the pack.mcmeta to get more info
          if (entry.entryName === 'pack.mcmeta') {
            mcmeta = JSON.parse(entry.getData().toString('utf8'));
          }

          // if pack.png exists, copy and set as the icon
          if (entry.entryName === 'pack.png') {
            iconData = entry.getData();
          }
        });
      } else if (fs.lstatSync(filePath).isDirectory()) {
        fs.readdirSync(filePath).forEach(file => {
          if (file === 'pack.mcmeta') {
            mcmeta = JSON.parse(fs.readFileSync(path.join(filePath, file)));
          } else if (file === 'pack.png') {
            iconData = fs.readFileSync(path.join(filePath, file));
          }
        });
      }


      if (mcmeta && mcmeta.pack) {
        if (mcmeta.pack.description) {
          // set description and remove minecraft color code stuff
          description = mcmeta.pack.description.replace(/§[a-zA-Z0-9]/g, '');
        }
      }

      if (iconData) {
        fs.writeFileSync(
          path.join(profile.profilePath, `/_mcm/icons/resourcepacks/${fileName}.png`), iconData
        );

        icon = `/_mcm/icons/resourcepacks/${fileName}.png`;
        iconPath = Global.replaceWindowsPath(path.join(profile.profilePath, icon));
      }

      resolve(new OMAFFileAsset({
        type: 'resourcepack',
        omafVersion: Global.OMAF_VERSION,
        id: Global.createID(fileName),
        name: path.parse(filePath).name,
        blurb: description,
        description: `${description.replace(/\n/g, '<br />')}<br /><br />Imported from ${fileName}`,
        icon,
        iconPath,
        version: {
          displayName: fileName,
          minecraft: {
            supportedVersions: ['unknown']
          }
        },
        files: [
          {
            displayName: 'Main File',
            type: 'resourcepackzip',
            priority: 'mainFile',
            path: `resourcepacks/${fileName}`
          }
        ],
        dependencies: [],
        hosts: {}
      }));
    });
  }
};

export default ResourcePacks;
