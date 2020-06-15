 import ADMZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import logInit from '../logger';
import Mod from '../../type/mod';
import Global from '../global';


const logger = logInit('ScanMods');

const Mods = {
  /**
   * Scans a mod file and returns an OMAF object
   * with all of the mod info it could find
   * @param {object} profile - The profile to use
   * @param {string} filePath - The path of the mod file to scan
   * @returns {object}
   */
  scanMod: (profile, filePath) => new Promise(async resolve => {
    logger.info(`Scanning "${filePath}" for ${profile.id}`);
    if (path.extname(filePath) === '.jar') {
      const zip = new ADMZip(filePath);
      const entries = zip.getEntries();
      const fileName = path.basename(filePath);

      // Create basic values
      let name, version, blurb, description, authors, icon, mcVersion, iconPath, credits;

      const infoFiles = [
        'mcmod.info',
        'fabric.mod.json'
      ];

      await Promise.all(
        entries.filter(
          e => infoFiles.includes(e.entryName)
        ).map(entry => new Promise(async res => {
          entry.getDataAsync(rawData => {
            try {
            const data = JSON.parse(rawData.toString('utf8'));

            const { entryName } = entry;
            if (entryName === 'mcmod.info') {
              // Forge mcmod.info file
              let info;

              if (data && data[0]) {
                // Sometimes data is stored in a top level array
                info = data[0];
              } else if (data.modList && data.modList[0]) {
                // ...while other times it's stored in a "modsList" array
                info = data.modList[0];
              }

              if (info) {
                name = info.name;
                version = info.version;
                iconPath = info.logoFile;
                mcVersion = info.mcversion;
                credits = info.credits;
                description = info.description;

                // assign authors if it exists
                if (info.authorList) authors = info.authorList.map(author => ({ name: author }));
              }

              res();
            } else if (entryName === 'fabric.mod.json') {
              // Fabric fabric.mod.json file
              if (data.schemaVersion === 1) {
                // fabric.mod.json schema version 1
                name = data.name;
                description = data.description;
                iconPath = data.icon;
                version = data.version;

                // assign authors if it exists
                if (data.authors) {
                  authors = data.authors.map(author => ({
                    name: author
                  }));
                }

                res();
              } else {
                // AFAIK no other schema versions exist besides 1
                // if its not 1 it will default to the basics
                res();
              }
            }
          } catch (e) {
            res();
          }
          });
        }
      )));

      if (!name) name = fileName;
      if (!version) version = fileName;
      if (!description) description = `Imported from ${fileName}`;

      if (iconPath) {
        // an icon was found; it must be extracted
        const extension = path.extname(iconPath); // get the extension name

        const fullIcoPath = path.join(profile.profilePath, `/_mcm/icons/mods/${fileName}${extension}`);
        // remove preceding slash
        if (iconPath.substring(0, 1) === '/') iconPath = iconPath.substring(1);


        fs.writeFileSync(
          fullIcoPath,
          zip.readFile(iconPath)
        );

        icon = `/_mcm/icons/mods/${fileName}${extension}`;
        iconPath = Global.replaceWindowsPath(fullIcoPath);
      }

      // finally return the mod
      resolve(new Mod({
        type: 'mod',
        omafVersion: Global.OMAF_VERSION,
        id: Global.createID(fileName),
        name,
        blurb,
        authors,
        icon,
        iconPath,
        description: `${description}${credits ? `<br /><br />Credits:<br />${credits}` : ''}`,
        dependencies: [],
        version: {
          displayName: version,
          minecraft: {
            supportedVersions: [mcVersion]
          }
        },
        files: [
          {
            displayName: 'Main JAR File',
            type: 'jar',
            priority: 'mainFile',
            path: `mods/${fileName}`
          }
        ]
      }));
    } else {
      resolve();
    }
  }),

    checkMod(profile, file) {
      return new Promise(async resolve => {
        const fullPath = path.join(profile.gameDir, `/mods/${file}`);

        const doesExist = profile.mods.find(
          mod => path.join(profile.gameDir, mod.getMainFile().path) === fullPath
        );

        if (!doesExist) {
          const mod = await this.scanMod(profile, fullPath);
          if (mod) {
            profile.addSubAsset('mod', mod, { disableSave: true });
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

      // Check for mods that have been removed
      profile.mods.forEach(mod => {
        if (!fs.existsSync(path.join(profile.gameDir, mod.getMainFile().path))) {
          logger.info(`Mod "${mod.id}" in "${profile.id}" is missing. Removing it...`);
          profile.deleteSubAsset('mod', mod, false);
          changed = true;
        }
      });

      // Check for mods that have been added
      fs.readdir(path.join(profile.gameDir, '/mods'), async (err, files) => {
        if (!err && files.length !== profile.mods.length) {
          await Promise.all(
            files.map(file => new Promise(async res => {
              const c = await this.checkMod(profile, file);
              if (c && !changed) changed = true;
              res();
            })
          ));
        }

        resolve(changed);
      });
    });
  }
};

export default Mods;
