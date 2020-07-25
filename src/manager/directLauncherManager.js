/* eslint-disable no-return-await */
/* eslint-disable new-cap */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-template-curly-in-string */
import path from 'path';
import fs from 'fs';
import os from 'os';
import mkdirp from 'mkdirp';
import crypto from 'crypto';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import FSU from '../util/fsu';
import LibrariesManager from './librariesManager';
import logInit from '../util/logger';
import DownloadsManager from './downloadsManager';
import Global from '../util/global';
import SettingsManager from './settingsManager';
import JavaHandler from '../minecraft/javaHandler';
import MCAccountsHandler from '../minecraft/mcAccountsHandler';
import AlertManager from './alertManager';
import Downloader from '../util/downloader';

const { exec } = require('child_process');
const admzip = require('adm-zip');
/**
 * Direct Launcher Manager handles the launching of a profile directly, bypassing the Minecraft launcher
 * This is pretty complex, it's a bit of a mess
 */

const logger = logInit('DirectLauncherManager');

const DirectLauncherManager = {
  concurrentDownloads: [],
  downloadMinecraftJAR(profile) {
    return new Promise(async resolve => {
      if (!fs.existsSync(path.join(Global.MCM_PATH, `/shared/jars/${profile.version.minecraft.version}.jar`))) {
        const data = await FSU.readJSON(path.join(profile.mcmPath, '/version/default.json'));
        await DownloadsManager.startFileDownload(
          `Minecraft ${profile.version.minecraft.version} Client JAR`,
          data.downloads.client.url,
          path.join(Global.MCM_PATH, `/shared/jars/${profile.version.minecraft.version}.jar`)
        );
      }

      resolve();
    });
  },
  async getVersionJSON(profile) {
    logger.info(`Getting Version JSON for ${profile.id}`);
    return await FSU.readJSON(
      path.join(
        profile.mcmPath,
        '/version.json'
      )
    );
  },

  generateClasspath(profile, versionJSON) {
    return new Promise((resolve) => {
    let cpString = '"';
    versionJSON.libraries.forEach(library => {
      if (this.allowLibrary(library) && !library.natives) {
        cpString += `../../../shared/libraries/${this.calculateMavenPath(library.name)};`;
      }
    });

    let files = [];
    if (fs.existsSync(path.join(profile.mcmPath, '/jarmods'))) {
      files = fs.readdirSync(path.join(profile.mcmPath, '/jarmods'));
    }

    if (!files.length) {
      cpString += `../../../shared/jars/${profile.version.minecraft.version}.jar`;
      cpString += '"';
      resolve(cpString);
    } else {
      // Jarmods are installed; we need to patch the Minecraft jar
      const archive = archiver('zip');

      const zip = new AdmZip(path.join(Global.MCM_PATH, `/shared/jars/${profile.version.minecraft.version}.jar`));

      const appendedJarEntries = [];

      files.forEach(jarFile => {
        const jarZip = new AdmZip(path.join(profile.mcmPath, `/jarmods/${jarFile}`));
        jarZip.getEntries().forEach(entry => {
          appendedJarEntries.push(entry.entryName);
          archive.append(entry.getData(), { name: entry.entryName });
        });
      });

      zip.getEntries().forEach(entry => {
        if (entry.entryName.indexOf('META-INF/') === -1 && !appendedJarEntries.includes(entry.entryName)) {
          archive.append(entry.getData(), { name: entry.entryName });
        }
      });


      archive.pipe(fs.createWriteStream(path.join(profile.mcmPath, '/patched.jar')));

      archive.finalize();

      archive.on('end', () => {
        cpString += `../../../profiles/${profile.id}/_mcm/patched.jar`;
        cpString += '"';

        resolve(cpString);
      });
    }
  });
  },

  allowRule(rule) {
    let allow;
    if (rule.action === 'allow') {
      if (rule.os) {
        if (rule.os.name) {
          allow = rule.os.name === this.getOSName();
        }

        if (rule.os.arch) {
          if (rule.os.arch === 'x86') {
            allow = os.arch() === 'x64';
          }
        }
      }

      if (rule.features) {
        allow = false;
      }
    } else if (rule.action === 'disallow') {
      if (rule.os) {
        if (rule.os.name) {
          allow = rule.os.name !== this.getOSName();
        }

        if (rule.os.arch) {
          if (rule.os.arch === 'x86') {
            allow = os.arch() !== 'x64';
          }
        }
      }
    }

    return allow;
  },

  runCommand(profile, versionJSON, binName) {
    return new Promise(async resolve => {
      const classpath = await this.generateClasspath(profile, versionJSON);

      let mcArgs = '';
      if (versionJSON.minecraftArguments) {
        // legacy system of arguments
        mcArgs = versionJSON.minecraftArguments;
      } else if (versionJSON.arguments && versionJSON.arguments.game) {
        versionJSON.arguments.game.forEach(arg => {
          if (typeof arg === 'string') {
            mcArgs += `${arg} `;
          } else if (typeof arg === 'object') {
            let allow = true;
            arg.rules.forEach(rule => {
              allow = this.allowRule(rule);
            });

            if (allow) {
              if (Array.isArray(arg.value)) {
                arg.value.forEach(r => {
                  mcArgs += `"${r}" `;
                });
              } else {
                mcArgs += `"${arg.value}" `;
              }
            }
          }
        });
      }

      mcArgs = mcArgs.replace(
        '${auth_player_name}',
        MCAccountsHandler.getNameFromUUID(SettingsManager.currentSettings.activeAccount));
      mcArgs = mcArgs.replace('${profile_name}', '"Minecraft Manager"');
      mcArgs = mcArgs.replace('${version_name}', '"Minecraft Manager"');
      mcArgs = mcArgs.replace('${game_directory}', `"${profile.gameDir}"`);
      mcArgs = mcArgs.replace('${assets_root}', '"../../../shared/assets"');
      mcArgs = mcArgs.replace('${game_assets}', '"../../../shared/assets"');

      mcArgs = mcArgs.replace('${assets_index_name}', versionJSON.assets);
      mcArgs = mcArgs.replace(
        '${auth_uuid}',
        SettingsManager.currentSettings.activeAccount
      );
      mcArgs = mcArgs.replace(
        '${auth_access_token}',
        MCAccountsHandler.getAccessTokenFromUUID(SettingsManager.currentSettings.activeAccount)
      );
      mcArgs = mcArgs.replace('${user_type}', 'mojang');
      mcArgs = mcArgs.replace('${user_properties}', '{}');
      mcArgs = mcArgs.replace('${auth_session}', `token:${MCAccountsHandler.getAccessTokenFromUUID(SettingsManager.currentSettings.activeAccount)}`);

      if (versionJSON.type) {
        mcArgs = mcArgs.replace('${version_type}', versionJSON.type);
      } else {
        mcArgs = mcArgs.replace('${version_type}', 'release');
      }


      let remainingArgs = '';
      if (SettingsManager.currentSettings.java.customArgsActive && !profile.mcm.java.overrideArgs) {
        remainingArgs += `${SettingsManager.currentSettings.java.customJavaArgs}`;
      }
      if (profile.mcm.java.overrideArgs) {
        remainingArgs += `${profile.mcm.java.customArgs}`;
      }

      const ramAmount = profile.mcm.java.overrideRam ? profile.mcm.java.dedicatedRam : SettingsManager.currentSettings.dedicatedRam;

      const endJavaArgs = `-Xmx${ramAmount}G ${remainingArgs} `;

      let finishedJavaArgs = '';

      if (!versionJSON.arguments) {
        // no arguments, we have to figure them out ourselves
        finishedJavaArgs = `-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump -Djava.library.path="../../../${binName}/natives/"`;
        finishedJavaArgs += ` -Dminecraft.client.jar="${path.join(profile.mcmPath, '/patched.jar')}"`;
        finishedJavaArgs += ` -cp ${classpath}`;
        finishedJavaArgs += ' -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M';
        finishedJavaArgs += ` ${endJavaArgs}`;
        finishedJavaArgs += ` ${versionJSON.mainClass}`;
        finishedJavaArgs += ` ${mcArgs}`;
      } else if (versionJSON.arguments.jvm) {
          versionJSON.arguments.jvm.forEach(arg => {
            if (typeof arg === 'string') {
              finishedJavaArgs += `${arg} `;
            } else if (typeof arg === 'object') {
              if (arg.rules) {
                let allow = true;
                arg.rules.forEach(rule => {
                  allow = this.allowRule(rule);
                });

                if (allow) {
                  if (Array.isArray(arg.value)) {
                    arg.value.forEach(a => {
                      finishedJavaArgs += `"${a}" `;
                    });
                  } else {
                    finishedJavaArgs += `"${arg.value}" `;
                  }
                }
              }
            }
          });

          finishedJavaArgs += endJavaArgs;
          finishedJavaArgs += `${versionJSON.mainClass} `;
          finishedJavaArgs += mcArgs;
        }


      finishedJavaArgs = finishedJavaArgs.replace('${launcher_name}', 'minecraft-launcher');
      finishedJavaArgs = finishedJavaArgs.replace('${launcher_version}', 'X');
      finishedJavaArgs = finishedJavaArgs.replace(
        '${natives_directory}',
        `"../../../${binName}/natives/"`
      );
      finishedJavaArgs = finishedJavaArgs.replace('${classpath}', classpath);

      let stderror = '';

      const process = exec(`set appdata="D:/loadingforgetest/" & "${path.relative(profile.gameDir, JavaHandler.getJavaPath(profile))}" ${finishedJavaArgs}`, {
        cwd: profile.gameDir
      });

      process.stderr.on('data', (data) => {
        stderror += data || '';
      });

      process.on('close', (code) => {
        if (code !== 0 && code) {
          AlertManager.messageBox('something went wrong', `Error Code: ${code}\n\n<textarea readOnly>${stderror}</textarea>`);
        }

        logger.info(`Removing ${binName} for ${profile.id}`);
        // rimraf.sync(path.join(Global.MCM_PATH, binName));
      });


      resolve();
    });
  },

  /**
   * Launches a profile directly
   * @param {object} profile - The profile to launch
   */
  launch(profile) {
    return new Promise(async (resolve, reject) => {
      if (!fs.existsSync(path.join(profile.profilePath, 'files'))) mkdirp.sync(path.join(profile.profilePath, 'files'));
      const binName = `gamebin/${Math.floor(Math.random() * 99999) + 10000}`;
      const binPath = path.join(Global.MCM_PATH, binName);
      mkdirp.sync(binPath);

      try {
        if (!MCAccountsHandler.getAccountFromUUID(SettingsManager.currentSettings.activeAccount)) {
          logger.info('No active account. Unable to launch.');
          AlertManager.messageBox('no account', 'You don\'t have an account setup. Go to Settings > Accounts to add one.');
          resolve();
          return;
        }
        logger.info(`Launching ${profile.id} directly`);
        const versionJSON = await this.getVersionJSON(profile);

        logger.info(`Downloading Minecraft JAR for ${profile.id}`);
        await this.downloadMinecraftJAR(profile);

        logger.info('Verifying downloaded libraries...');
        await this.verifyDownloadedLibraries(profile, versionJSON);
        logger.info('Downloaded libraries verification complete');

        logger.info('Verifying downloaded assets...');
        await this.verifyDownloadedAssets(profile, versionJSON);
        logger.info('Downloaded assets verification complete');

        logger.info('Extracting natives...');
        await this.extractNatives(profile, versionJSON, binPath);

        logger.info('Symlinking libraries...');
        this.symlinkLibraries(profile, versionJSON, binPath);

        logger.info('Finished extracting natives');
        logger.info('Generating and running command');
        await this.runCommand(profile, versionJSON, binName);

        setTimeout(() => {
          resolve();
        }, 3000);
      } catch (e) {
        reject(e);
      }
    });
  },

  calculateMavenPath(mvn) {
    const split = mvn.split(':');
    let EXTENSION = '.jar';
    let isSpecial = false;
    if (mvn.indexOf('@') !== -1) {
      const splitAt = mvn.split('@');
      EXTENSION = `.${splitAt[splitAt.length - 1]}`;
    }
    if (split[3]) {
      isSpecial = true;
      if (mvn.indexOf('@') !== -1) {
        split[3] = split[3].split('@')[0];
      }
    }
    if (isSpecial) {
      return `${split[0].replace(/\./g, '/')}/${split[1]}/${split[2]}/${split[1]}-${split[2]}-${split[3]}${EXTENSION}`;
    }
    return `${split[0].replace(/\./g, '/')}/${split[1]}/${split[2]}/${split[1]}-${split[2]}${EXTENSION}`;
  },

  getOSName() {
    if (os.platform() === 'win32') {
      return 'windows';
    } if (os.platform() === 'darwin') {
      return 'osx';
    } if (os.platform() === 'linux') {
      return 'linux';
    }

    return undefined;
  },

  allowLibrary(library) {
    let doAllow = true;
    if (library.rules) {
      library.rules.forEach(rule => {
        doAllow = this.allowRule(rule);
      });
    }

    return doAllow;
  },

  symlinkLibraries(profile, versionJSON, binPath) {
    versionJSON.libraries.forEach(library => {
      if (!library.natives && this.allowLibrary(library)) {
        const pathToSymlinkTo = path.join(binPath, `/${Global.createID(library.name)}.jar`);

        if (!fs.existsSync(pathToSymlinkTo)) {
          fs.linkSync(
            path.join(
              LibrariesManager.getLibrariesPath(),
              this.calculateMavenPath(library.name)
            ),
            pathToSymlinkTo
          );
        }
      }
    });
  },

  async extractNatives(profile, versionJSON, binPath) {
    const nativesPath = path.join(binPath, '/natives');

    FSU.createDirIfMissing(nativesPath);

    for (const library of versionJSON.libraries) {
      if (library.natives && this.allowLibrary(library)) {
        const nativeClassifier = library.natives[this.getOSName()].replace('${arch}', process.arch.substring(1));

        if (!library.downloads.classifiers[nativeClassifier]) {
          logger.info(`Native library "${library.name}" has no classifier for current platform, but is allowed?`);
          return;
        }

        logger.info(`Extracting natives from "${library.name}"`);
        const zip = new admzip(
          path.join(LibrariesManager.getLibrariesPath(), `/${library.downloads.classifiers[nativeClassifier].path}`)
        );
        const zipEntries = zip.getEntries();

        const allowedEntries = [];
        zipEntries.forEach(entry => {
          if (library.extract && library.extract.exclude) {
            let doAllow = true;
            let stop = false;
            for (const exclude of library.extract.exclude) {
              if (stop) break;
              if (exclude.substring(exclude.length - 1) === '/') {
                if (entry.entryName.substring(0, exclude.length) === exclude) {
                  doAllow = false;
                  stop = true;
                }
              } else if (exclude === entry.entryName) {
                doAllow = false;
                stop = true;
              }
            }

            if (doAllow) {
              allowedEntries.push(entry.entryName);
            }
          } else {
            allowedEntries.push(entry.entryName);
          }
        });

        allowedEntries.forEach(entry => {
          try {
            zip.extractEntryTo(entry, nativesPath, false, true);
          } catch (e) {
            logger.info(`Unable to extract native ${entry}; game may be running`);
          }
        });
      }
    }
  },

  async verifyDownloadedLibraries(profile, versionJSON) {
    for (const library of versionJSON.libraries) {
      if (this.allowLibrary(library)) {
        const mvnPath = this.calculateMavenPath(library.name);
        if (!library.natives) {
          const libPath = path.join(LibrariesManager.getLibrariesPath(), mvnPath);
          if (!fs.existsSync(libPath)) {
            logger.info(`Library "${library.name}" is missing. Downloading it...`);
            if (!library.downloads && !library.url && library.name.indexOf('minecraftmanager') === -1 && !library._disableDownload) {
              library.url = 'https://libraries.minecraft.net/';
            }
            if (!library.downloads && library.url) {
              // manually parse the downloads
              mkdirp.sync(path.dirname(libPath));

              // eslint-disable-next-line no-await-in-loop
              await DownloadsManager.startFileDownload(
                `Library "${library.name}"\n_A_${profile.name}`,
                `${library.url}${mvnPath}`,
                libPath
              );
            } else if (library.downloads) {
              mkdirp.sync(path.dirname(libPath));

              // eslint-disable-next-line no-await-in-loop
              await DownloadsManager.startFileDownload(
                `Library "${library.name}"\n_A_${profile.name}`,
                library.downloads.artifact.url,
                libPath
              );
            }
          } else {
            logger.info(`Library "${library.name}" is not missing.`);
          }
        } else {
          logger.info(`Library "${library.name}" has natives.`);
          const nativeClassifier = library.natives[this.getOSName()].replace('${arch}', process.arch.substring(1));
          if (library.downloads) {
            const libPath = path.join(
              LibrariesManager.getLibrariesPath(),
              library.downloads.classifiers[nativeClassifier].path
            );
            if (!fs.existsSync(libPath)) {
              logger.info(`Native library "${library.name}" is missing. Downloading it...`);

              mkdirp.sync(path.dirname(libPath));

              // eslint-disable-next-line no-await-in-loop
              await DownloadsManager.startFileDownload(
                `Native library "${library.name}"\n_A_${profile.name}`,
                library.downloads.classifiers[nativeClassifier].url,
                libPath
              );
            }
          }
        }
      }
    }
  },

  async downloadAssetsList(profileName, assetsList, callback, onUpdate, concurrent) {
    if (concurrent !== 0 && concurrent !== undefined) {
      for (let i = 0; i < concurrent - 1; i++) {
        setTimeout(() => {
          this.downloadAssetsList(profileName, assetsList, callback, onUpdate);
        }, 1000);
      }
    }

    if (assetsList.length === 0) {
      callback();
    } else {
      const item = { ...assetsList[0] };
      if (this.concurrentDownloads.includes(item.name)) {
        const list2 = assetsList.slice();
        list2.shift();
        this.downloadAssetsList(profileName, list2, callback, onUpdate);
      } else {
        this.concurrentDownloads.push(item.name);
        FSU.createDirIfMissing(path.join(Global.MCM_PATH, `/shared/assets/objects/${item.hash.substring(0, 2)}`));
        await DownloadsManager.startFileDownload(
          `${item.name}\n_A_${profileName}`,
          `https://resources.download.minecraft.net/${item.hash.substring(0, 2)}/${item.hash}`,
          path.join(Global.MCM_PATH, `/shared/assets/objects/${item.hash.substring(0, 2)}/${item.hash}`)
        );

        onUpdate();
        assetsList.shift();
        this.downloadAssetsList(profileName, assetsList, callback, onUpdate);
      }
    }
  },

  async verifyDownloadedAssets(profile, versionJSON) {
    return new Promise(async resolve => {
      const assetsPath = path.join(Global.MCM_PATH, '/shared/assets/');
      FSU.createDirIfMissing(assetsPath);
      FSU.createDirIfMissing(path.join(assetsPath, '/indexes'));
      FSU.createDirIfMissing(path.join(assetsPath, '/objects'));

      if (versionJSON.assetIndex) {
        const assetIndexPath = path.join(assetsPath, `/indexes/${versionJSON.assetIndex.id}.json`);

        const downloadAssetIndex = async () => DownloadsManager.startFileDownload(
            `Asset Index ${versionJSON.assetIndex.id}\n_A_${profile.name}`,
            versionJSON.assetIndex.url,
            assetIndexPath
          );

        if (!fs.existsSync(assetIndexPath)) {
          await downloadAssetIndex();
        } else {
          const sum = crypto.createHash('sha1');
          sum.update(fs.readFileSync(assetIndexPath));
          const hash = sum.digest('hex');

          if (hash === versionJSON.assetIndex.sha1) {
            logger.info(`Current asset index for ${versionJSON.assetIndex.id} is up-to-date. Hashes match.`);
          } else {
            logger.info(
              `Current asset index for ${versionJSON.assetIndex.id} is not up-to-date. Downloading up-to-date version`
            );
            fs.unlinkSync(assetIndexPath);
            await downloadAssetIndex();
          }
        }

        if (fs.existsSync(assetIndexPath)) {
          let downloadsFinished = 0;
          let totalDownloads = 0;
          const download = await DownloadsManager.createProgressiveDownload(`Minecraft Assets\n_A_${profile.name}`);
          const indexJSON = await FSU.readJSON(assetIndexPath);

          const downloadFinished = () => {
            downloadsFinished++;
            DownloadsManager.setDownloadProgress(download.name, Math.ceil((downloadsFinished / totalDownloads) * 100));
          };

          const toDownload = Object.keys(indexJSON.objects).map(object => {
            const hash = indexJSON.objects[object].hash;
            const hashedObjectPath = path.join(assetsPath, `/objects/${hash.substring(0, 2)}/${hash}`);
            if (!fs.existsSync(hashedObjectPath)) {
              FSU.createDirIfMissing(path.join(Global.MCM_PATH, `/shared/assets/objects/${hash.substring(0, 2)}`));
              totalDownloads++;
              return {
                url: `https://resources.download.minecraft.net/${hash.substring(0, 2)}/${hash}`,
                dest: path.join(Global.MCM_PATH, `/shared/assets/objects/${hash.substring(0, 2)}/${hash}`),
                onFinish: downloadFinished
              };
            }

            return undefined;
          });

          await Downloader.downloadConcurrently(toDownload);
          DownloadsManager.removeDownload(download.name);

          if (versionJSON.assets === 'pre-1.6') {
            // this is a pre-1.6 version;
            // assets must be copied to the resources folder
            const resourcesPath = path.join(profile.gameDir, '/resources');
            FSU.createDirIfMissing(resourcesPath);
            Object.keys(indexJSON.objects).forEach(object => {
              const hash = indexJSON.objects[object].hash;
              const hashedObjectPath = `/objects/${hash.substring(0, 2)}/${hash}`;
              if (!fs.existsSync(path.join(resourcesPath, hashedObjectPath))) {
                const objResourcesPath = path.join(resourcesPath, object);
                FSU.createDirIfMissing(path.dirname(objResourcesPath));
                fs.copyFileSync(path.join(assetsPath, hashedObjectPath), objResourcesPath);
              }
            });
          }

          resolve();
        }
      }
    });
  }
};

export default DirectLauncherManager;
