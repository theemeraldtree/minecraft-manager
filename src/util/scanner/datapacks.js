import fs from 'fs';
import path from 'path';
import OMAFFileAsset from '../../type/omafFileAsset';
import Global from '../global';
import logInit from '../logger';

const logger = logInit('ScanDatapacks');

const Datapacks = {
  scanDatapack: (profile, filePath) => new Promise(async resolve => {
    const fileName = path.basename(filePath);
    let name = fileName;
    let fileType = 'datapackfolder';
    if (name.substring(name.length - 4) === '.zip') {
      name = name.substring(0, name.length - 4);
      fileType = 'datapackzip';
    }

    resolve(new OMAFFileAsset({
      type: 'datapack',
      omafVersion: Global.OMAF_VERSION,
      id: Global.createID(fileName),
      name,
      blurb: fileName,
      icon: '',
      description: fileName,
      version: {
        displayName: fileName,
        minecraft: {
          supportedVersions: profile.version.minecraft.version
        }
      },
      files: [
        {
          displayName: 'Main Datapack File',
          type: fileType,
          priority: 'mainFile',
          path: `datapacks/${fileName}`
        }
      ],
      hosts: {},
      dependencies: []
    }));
  }),
  checkDatapack(profile, world, file) {
    return new Promise(async resolve => {
      const fullWorldPath = path.join(profile.gameDir, world.getMainFile().path);
      const fullDPPath = path.join(fullWorldPath, `/datapacks/${file}`);

      const doesExist = world.datapacks.find(dp => path.join(fullWorldPath, dp.getMainFile().path) === fullDPPath);

      if (!doesExist) {
        const dp = await this.scanDatapack(profile, fullDPPath);
        if (dp) {
          world.datapacks.push(dp);
          resolve(true);
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  },
  scanProfile(profile) {
    return new Promise(async resolve => {
      let changed = false;
      await Promise.all(profile.worlds.map(world => new Promise(async resWorld => {
        const fullWorldPath = path.join(profile.gameDir, world.getMainFile().path);
        // Check for datapacks that have been removed
        world.datapacks.forEach(datapack => {
          if (!fs.existsSync(path.join(fullWorldPath, datapack.getMainFile().path))) {
            logger.info(`Datapack "${datapack.id}" in world "${world.id}" in profile "${profile.id}" is missing. Removing it...`);
            world.deleteDatapack(profile, datapack);
            changed = true;
          }
        });

        // Check for datapacks that have been added
        fs.readdir(path.join(fullWorldPath, '/datapacks'), async (err, files) => {
          if (!err && files.length !== world.datapacks.length) {
            await Promise.all(
              files.map(file => new Promise(async res => {
                const c = await this.checkDatapack(profile, world, file);
                if (c && !changed) changed = true;
                res();
              }))
            );
          }

          resWorld();
        });
      })));

      resolve(changed);
    });
  }
};

export default Datapacks;
