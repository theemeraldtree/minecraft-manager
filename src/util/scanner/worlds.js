import nbt from 'prismarine-nbt';
import path from 'path';
import fs from 'fs';
import ADMZip from 'adm-zip';
import rimraf from 'rimraf';
import Global from '../global';
import FSU from '../fsu';
import logInit from '../logger';
import World from '../../type/world';
import Scanner from './scanner';

const logger = logInit('ScanWorlds');

const Worlds = {
  scanWorld(profile, dirPath) {
    return new Promise(resolve => {
      logger.info(`Scanning "${dirPath}" for ${profile.id}`);
      if (fs.lstatSync(dirPath).isDirectory()) {
        const levelDatPath = path.join(dirPath, 'level.dat');
        if (fs.existsSync(levelDatPath)) {
          const fileName = path.basename(dirPath);
          const rawLevelDat = fs.readFileSync(levelDatPath);
          nbt.parse(rawLevelDat, (err, leveldat) => {
            const data = leveldat.value.Data.value;
            const worldID = `${Global.createID(fileName)}-${Math.floor(Math.random() * (999 - 100 + 1) + 100)}`;

            let supportedVersion = profile.version.minecraft.version;
            let name;

            if (data.LevelName && data.LevelName.value) {
              name = data.LevelName.value;
            } else {
              name = fileName;
            }

            if (data.Version?.value?.Name?.value) {
              supportedVersion = data.Version.value.Name.value;
            }

            let icon = '';
            let iconPath;

            if (fs.existsSync(path.join(dirPath, '/icon.png'))) {
              icon = `game:saves/${fileName}/icon.png`;
              iconPath = Global.replaceWindowsPath(path.join(dirPath, '/icon.png'));
            }

            resolve(
              new World({
                type: 'world',
                omafVersion: Global.OMAF_VERSION,
                id: worldID,
                name,
                icon,
                iconPath,
                blurb: fileName,
                description: name,
                version: {
                  displayName: fileName,
                  minecraft: {
                    supportedVersions: [supportedVersion]
                  }
                },
                files: [
                  {
                    displayName: 'World Folder',
                    type: 'worldfolder',
                    priority: 'mainFile',
                    path: `saves/${fileName}`
                  }
                ],
                hosts: {},
                dependencies: []
              })
            );
          });
        }
      }
    });
  },
  importWorldDir(profile, dirPath, doScan, forceName) {
    return new Promise(async resolve => {
      const worlds = [];
      fs.readdirSync(dirPath).forEach(file => {
        if (fs.lstatSync(path.join(dirPath, file)).isDirectory()) {
          // first file is a directory; need to extract this folder
          fs.readdirSync(path.join(dirPath, file)).forEach(f => {
            if (f === 'level.dat') {
              // we found the world
              worlds.push({
                name: file,
                path: file
              });
            }
          });
        }

        if (file === 'level.dat') {
          worlds.push({
            name: path.basename(dirPath),
            path: '/'
          }); // root folder is the world
        }
      });

      await Promise.all(
        worlds.map(world =>
          FSU.copyDir(
            path.join(dirPath, world.path),
            path.join(profile.gameDir, `/saves/${!forceName ? world.name : forceName}`)
          )
        )
      );

      if (doScan) {
        await Promise.all(
          worlds.map(
            world =>
              new Promise(async res => {
                profile.addSubAsset(
                  'world',
                  await this.scanWorld(profile, path.join(profile.gameDir, `/saves/${world.name}/`)),
                  { disableSave: true }
                );
                res();
              })
          )
        );

        profile.save();
      }

      Scanner.datapacks.scanProfile(profile);
      resolve();
    });
  },
  importWorldZip(profile, filePath, doScan, forceName) {
    return new Promise(resolve => {
      const zip = new ADMZip(filePath);
      const tempExtPath = path.join(Global.MCM_TEMP, `/world-extract-${path.basename(filePath, '.zip')}/`);
      zip.extractAllToAsync(tempExtPath, false, async () => {
        await this.importWorldDir(profile, tempExtPath, doScan, forceName);
        rimraf.sync(tempExtPath);
        resolve();
      });
    });
  },
  importWorld(profile, filePath, doScan, forceName) {
    if (fs.lstatSync(filePath).isDirectory()) {
      // world is a directory; skip to directory scannig
      return this.importWorldDir(profile, filePath, doScan, forceName);
    }
    if (path.extname(filePath) === '.zip') {
      // World is zipped; unzip to temp first
      return this.importWorldZip(profile, filePath, doScan, forceName);
    }

    return Promise.resolve();
  },
  checkWorld(profile, file) {
    return new Promise(async resolve => {
      const fullPath = path.join(profile.gameDir, `/saves/${file}`);

      if (fs.lstatSync(fullPath).isDirectory()) {
        const doesExist = profile.worlds.find(
          world => path.join(profile.gameDir, world.getMainFile().path) === fullPath
        );

        if (!doesExist) {
          const world = await this.scanWorld(profile, fullPath);
          profile.addSubAsset('world', world, { disableSave: true });
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
    return new Promise(resolve => {
      let changed = false;

      // Check for worlds that have been removed
      profile.worlds.forEach(world => {
        if (!fs.existsSync(path.join(profile.gameDir, world.getMainFile().path))) {
          logger.info(`World "${world.id}" in "${profile.id}" is missing. Removing it...`);

          profile.deleteSubAsset('world', world, false);
          changed = true;
        }
      });

      // Check for worlds that have been added
      fs.readdir(path.join(profile.gameDir, '/saves'), async (err, files) => {
        if (!err && files.length !== profile.worlds.length) {
          await Promise.all(
            files.map(
              file =>
                new Promise(async res => {
                  const c = await this.checkWorld(profile, file);
                  if (c && !changed) changed = true;
                  res();
                })
            )
          );
        }

        resolve(changed);
      });
    });
  }
};

export default Worlds;
