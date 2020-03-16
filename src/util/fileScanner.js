import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import rimraf from 'rimraf';
import LogManager from '../manager/logManager';
import GenericAsset from '../type/genericAsset';
import Global from './global';
import Mod from '../type/mod';
import World from '../type/world';

const nbt = require('prismarine-nbt');

/* FileScanner scans through different types of non-OMAF files (such as Mod JARs or Resource Pack ZIPs),
to convert them to OMAF-compliant data using the available information */

const FileScanner = {
  scanResourcePack: (profile, file) => {
    const fullPath = path.join(profile.gameDir, `/resourcepacks/${file}`);
    const doesExist = profile.resourcepacks.find(rp => path.join(profile.gameDir, rp.getMainFile().path) === fullPath);
    if (!doesExist) {
      if (path.extname(file) === '.zip') {
        // zipped resource pack, not a folder
        const zip = new AdmZip(fullPath);
        const entries = zip.getEntries();
        let iconPath;
        let description;

        entries.forEach(entry => {
          // look for pack.mcmeta to provide more information
          if (entry.entryName === 'pack.mcmeta') {
            const parsed = JSON.parse(entry.getData().toString('utf8'));
            if (parsed && parsed.pack) {
              if (parsed.pack.description) {
                // set description and remove any minecraft color code stuff
                description = parsed.pack.description.replace(/§[a-zA-Z0-9]/g, '');
              }
            }
          }

          // if pack.png exists, copy and set as the icon
          if (entry.entryName === 'pack.png') {
            fs.writeFileSync(path.join(profile.profilePath, `/_mcm/icons/resourcepacks/${file}.png`), entry.getData());
            iconPath = `/_mcm/icons/resourcepacks/${file}.png`;
          }
        });

        LogManager.log(
          'info',
          `[scan] {${profile.name}} Found resource pack ${file} which does not exist in subassets file. Adding it...`
        );

        profile.resourcepacks.push(
          new GenericAsset({
            icon: iconPath,
            id: Global.createID(path.parse(file).name),
            name: path.parse(file).name,
            version: {
              displayName: file,
              minecraft: {
                supportedVersions: ['unknown']
              }
            },
            blurb: description,
            description: `Imported from ${file}`,
            hosts: {},
            files: [
              {
                displayName: 'Main File',
                type: 'resourcepackzip',
                priority: 'mainFile',
                path: `resourcepacks/${file}`
              }
            ],
            dependencies: []
          })
        );
        profile.save();
      } else {
        // folder, not a zipped resourcep ack

        // loop through files in the folder to find what we want

        let iconPath, description;
        let containsMCMeta = false;
        fs.readdirSync(fullPath).forEach(f => {
          if (f === 'pack.mcmeta') {
            containsMCMeta = true;
            const parsed = JSON.parse(fs.readFileSync(path.join(fullPath, f)));
            if (parsed && parsed.pack) {
              if (parsed.pack.description) {
                // set description and remove any minecraft color code stuff
                description = parsed.pack.description.replace(/§[a-zA-Z0-9]/g, '');
              }
            }
          } else if (f === 'pack.png') {
            fs.writeFileSync(
              path.join(profile.profilePath, `/_mcm/icons/resourcepacks/${file}.png`),
              fs.readFileSync(path.join(fullPath, f))
            );
            iconPath = `/_mcm/icons/resourcepacks/${file}.png`;
          }
        });

        if (containsMCMeta) {
          profile.resourcepacks.push(
            new GenericAsset({
              icon: iconPath,
              id: Global.createID(path.parse(file).name),
              name: path.parse(file).name,
              version: {
                displayName: file,
                minecraft: {
                  supportedVersions: ['unknown']
                }
              },
              blurb: description,
              description: `Imported from ${file}`,
              hosts: {},
              files: [
                {
                  displayName: 'Main Folder',
                  type: 'resourcepackfolder',
                  priority: 'mainFile',
                  path: `resourcepacks/${file}`
                }
              ],
              dependencies: []
            })
          );
          profile.save();
        }
      }
    }
  },
  scanMod: (profile, file) => {
    const fullPath = path.join(profile.gameDir, `/mods/${file}`);
    const doesExist = profile.mods.find(mod => path.join(profile.gameDir, mod.getJARFile().path) === fullPath);
    if (!doesExist) {
      LogManager.log(
        'info',
        `[scan] {${profile.id}} Found mod file ${file} which does not exist in subassets file. Adding it...`
      );

      // only do jar files, nothing else
      if (path.extname(file) === '.jar') {
        const zip = new AdmZip(fullPath);
        const entries = zip.getEntries();

        let name, version, blurb, description, authors, icon, mcVersion, iconPath, credits;
        entries.forEach(entry => {
          if (entry.entryName === 'mcmod.info') {
            let data = entry.getData().toString('utf8');

            // unfortunately new lines have to be remvoed
            // this also means newlines will be removed from descriptions
            // an unfortunate shame
            // the JSON parser does not like newlines and doesn't work if they exist
            data = data.replace(/\r?\n|\r/g, '');
            const parsed = JSON.parse(data);
            if (parsed && parsed[0]) {
              const info = parsed[0];
              name = info.name;
              version = info.version;
              blurb = `Imported from ${file}`;
              description = info.description;
              authors = info.authorList.map(author => ({
                name: author
              }));
              iconPath = info.logoFile;
              mcVersion = info.mcversion;
              credits = info.credits;
            }
          }
        });

        if (iconPath) {
          const extension = path.extname(iconPath);

          if (iconPath.substring(0, 1) === '/') {
            iconPath = iconPath.substring(1);
          }

          fs.writeFileSync(
            path.join(profile.profilePath, `_mcm/icons/mods/${file}${extension}`),
            zip.readFile(iconPath)
          );

          icon = `/_mcm/icons/mods/${file}${extension}`;
        }

        profile.mods.push(
          new Mod({
            id: Global.createID(path.parse(file).name),
            name,
            version: {
              displayName: version,
              minecraft: {
                supportedVersions: [mcVersion]
              }
            },
            blurb,
            authors,
            icon,
            description: `${description}<br /><br />Credits:<br />${credits}<br /><br />Imported from ${file}`,
            hosts: {},
            files: [
              {
                displayName: 'Main JAR File',
                type: 'jar',
                priority: 'mainFile',
                path: `mods/${file}`
              }
            ],
            dependencies: []
          })
        );
        profile.save();
      }
    }
  },
  scanWorld(profile, file) {
    const fullPath = path.join(profile.gameDir, `/saves/${file}`);
    const doesExist = profile.worlds.find(world => path.join(profile.gameDir, world.getMainFile().path) === fullPath);
    if (!doesExist) {
      LogManager.log(
        'info',
        `[scan] {${profile.id}} Found world ${file} which does not exist in subassets file. Adding it...`
      );

      const rawleveldat = fs.readFileSync(path.join(fullPath, 'level.dat'));
      nbt.parse(rawleveldat, (err, leveldat) => {
        const data = leveldat.value.Data.value;
        const worldID = `${Global.createID(path.parse(file).name)}-${Math.floor(
          Math.random() * (999 - 100 + 1) + 100
        )}`;
        let supportedVersion = profile.version.minecraft.version;
        let name;

        if (data.LevelName && data.LevelName.value) {
          name = data.LevelName.value;
        } else {
          name = file;
        }

        if (data.Version && data.Version.value && data.Version.value.Name) {
          supportedVersion = data.Version.value.Name.value;
        }

        let icon = '';

        if (fs.existsSync(path.join(fullPath, '/icon.png'))) {
          icon = `game:saves/${file}/icon.png`;
        }

        profile.worlds.push(
          new World({
            id: worldID,
            name,
            version: {
              displayName: file,
              minecraft: {
                supportedVersions: supportedVersion
              }
            },
            blurb: `${file}`,
            icon,
            description: name,
            hosts: {},
            datapacks: [],
            files: [
              {
                displayName: 'World Folder',
                type: 'worldfolder',
                priority: 'mainFile',
                path: `saves/${file}`
              }
            ],
            dependencies: []
          })
        );

        profile.save();
      });
    }
  },
  scanDatapack(profile, world, file) {
    const fullPath = path.join(profile.gameDir, `${world.getMainFile().path}/datapacks/${file}`);
    const doesExist = world.datapacks.find(
      dp => path.join(profile.gameDir, `${world.getMainFile().path}/${dp.getMainFile().path}`) === fullPath
    );
    if (!doesExist) {
      LogManager.log(
        'info',
        `[scan] {${profile.id}} Found datapack ${file} in world ${world.id} which does not exist in subassets file. Adding it...`
      );

      let name = file;
      if (name.substring(name.length - 4) === '.zip') {
        name = name.substring(0, name.length - 4);
      }

      world.datapacks.push(
        new GenericAsset({
          id: Global.createID(file),
          name,
          version: {
            displayName: file,
            minecraft: {
              supportedVersions: profile.version.minecraft.version
            }
          },
          blurb: file,
          icon: '',
          description: file,
          hosts: {},
          files: [
            {
              displayName: 'Main Datapack File',
              type: 'datapackzip',
              priority: 'mainFile',
              path: `datapacks/${file}`
            }
          ],
          dependencies: []
        })
      );
    }
  },
  // this is run when a world .zip file is downloaded
  // it extracts only the correct folder, and places it into /saves
  scanInstallingWorld(profile, zipPath, asset) {
    const zip = new AdmZip(zipPath);

    const extractedPath = path.join(Global.MCM_TEMP, `/world-install/${Global.createID(asset.name)}-extracted`);
    zip.extractAllToAsync(extractedPath, true, () => {
      const worlds = [];

      fs.readdirSync(extractedPath).forEach(f => {
        if (fs.lstatSync(path.join(extractedPath, f)).isDirectory()) {
          fs.readdirSync(path.join(extractedPath, f)).forEach(file => {
            if (file === 'level.dat') {
              worlds.push(f);
            }
          });
        }
      });

      worlds.forEach(world => {
        Global.copyDirSync(
          path.join(extractedPath, world),
          path.join(profile.gameDir, `/saves/${Global.createID(asset.name)}`)
        );
      });

      fs.unlinkSync(zipPath);
      rimraf.sync(extractedPath);
    });
  }
};

export default FileScanner;
