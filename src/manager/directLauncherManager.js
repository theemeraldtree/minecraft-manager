/* eslint-disable */
import path from 'path';
import fs from 'fs';
import os from 'os';
import FSU from '../util/fsu';
import VersionsManager from './versionsManager';
import LibrariesManager from './librariesManager';
import logInit from '../util/logger';
import mkdirp from 'mkdirp';
import DownloadsManager from './downloadsManager';
import rimraf from 'rimraf';
import LauncherManager from './launcherManager';
import Global from '../util/global';
const { exec } = require('child_process');
const admzip = require('adm-zip');
/**
 * Direct Launcher Manager handles the launching of a profile directly, bypassing the Minecraft launcher
 * This is pretty complex, it's a bit of a mess
 */

const logger = logInit('DirectLauncherManager');

const DirectLauncherManager = {
  downloadDefaultProfile(version) {
    return new Promise(async resolve => {
      if (!fs.existsSync(path.join(VersionsManager.getVersionsPath(), `/${version}`))) {
        mkdirp.sync(path.join(VersionsManager.getVersionsPath(), `/${version}`));
      }

      if (!fs.existsSync(path.join(VersionsManager.getVersionsPath(), `/${version}/${version}.json`))) {
        const vers = await HTTPRequest.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');
        await DownloadsManager.startFileDownload(
          `Minecraft ${version} Version Info`,
          vers.versions.find(a => a.id === version).url,
          path.join(VersionsManager.getVersionsPath(), `/${version}/${version}.json`)
        );
      }

      if (!fs.existsSync(path.join(VersionsManager.getVersionsPath(), `/${version}/${version}.jar`))) {
        const data = await FSU.readJSON(path.join(VersionsManager.getVersionsPath(), `/${version}/${version}.json`));
        await DownloadsManager.startFileDownload(
          `Minecraft ${version} Client JAR`,
          data.downloads.client.url,
          path.join(VersionsManager.getVersionsPath(), `${version}/${version}.jar`)
        );
      }

      resolve();
    });
  },
  async getVersionJSON(profile) {
    logger.info(`Getting Version JSON for ${profile.id}`);
    if (profile.getPrimaryFramework() !== 'none') {
      const plain = await FSU.readJSON(
        path.join(VersionsManager.getVersionsPath(), `/${profile.versionname}/${profile.versionname}.json`)
      );

      let inherited, final;

      if (plain.inheritsFrom) {
        inherited = await FSU.readJSON(
          path.join(VersionsManager.getVersionsPath(), `/${plain.inheritsFrom}/${plain.inheritsFrom}.json`)
        );
      }

      if (inherited) {
        let finalLibraries = inherited.libraries;
        if (plain.libraries) {
          finalLibraries = [...plain.libraries, ...inherited.libraries];
        }

        final = Object.assign({ ...inherited }, plain);
        final.libraries = finalLibraries;

        if (plain.arguments && plain.arguments.game) {
          final.arguments.game = [...plain.arguments.game, ...inherited.arguments.game];
        } else if (inherited.arguments && inherited.arguments.game) {
          final.arguments.game = inherited.arguments.game;
        }
        if (plain.arguments && plain.arguments.jvm) {
          final.arguments.jvm = [...plain.arguments.jvm, ...inherited.arguments.jvm];
        } else if (inherited.arguments && inherited.arguments.jvm) {
          final.arguments.jvm = inherited.arguments.jvm;
        }
      } else {
        final = plain;
      }

      return final;
    } else {
      if (profile.id === '0-default-profile-latest') {
        const latestVersion = Global.MC_VERSIONS[0];
        await this.downloadDefaultProfile(latestVersion);
        return await FSU.readJSON(
          path.join(VersionsManager.getVersionsPath(), `/${latestVersion}/${latestVersion}.json`)
        );
      } else if (profile.id === '0-default-profile-snapshot') {
        const latestSnapshot = Global.ALL_VERSIONS[0];
        await this.downloadDefaultProfile(latestSnapshot);
        return await FSU.readJSON(
          path.join(VersionsManager.getVersionsPath(), `/${latestSnapshot}/${latestSnapshot}.json`)
        );
      } else {
        return await FSU.readJSON(
          path.join(
            VersionsManager.getVersionsPath(),
            `/${profile.version.minecraft.version}/${profile.version.minecraft.version}.json`
          )
        );
      }
    }
  },

  generateClasspath(profile, versionJSON) {
    let cpString = '';
    versionJSON.libraries.forEach(library => {
      if (this.allowLibrary(library) && !library.natives) {
        cpString += `${path.join(LibrariesManager.getLibrariesPath(), this.calculateMavenPath(library.name))};`;
      }
    });

    if (versionJSON.jar) {
      cpString += `${path.join(VersionsManager.getVersionsPath(), `/${versionJSON.jar}/${versionJSON.jar}.jar`)}`;
    } else {
      cpString += `${path.join(VersionsManager.getVersionsPath(), `/${versionJSON.id}/${versionJSON.id}.jar`)}`;
    }

    return cpString;
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

  runCommand(profile, versionJSON) {
    return new Promise(async resolve => {
      const classpath = this.generateClasspath(profile, versionJSON);
      const launcherProfiles = await FSU.readJSON(LauncherManager.getLauncherProfiles());

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
        Object.values(Object.values(launcherProfiles.authenticationDatabase)[0].profiles)[0].displayName
      );
      mcArgs = mcArgs.replace('${version_name}', `"${profile.versionname}"`);
      mcArgs = mcArgs.replace('${game_directory}', `"${profile.gameDir}"`);
      mcArgs = mcArgs.replace('${assets_root}', `"${path.join(Global.getMCPath(), '/assets')}"`);
      mcArgs = mcArgs.replace('${assets_index_name}', versionJSON.assets);
      mcArgs = mcArgs.replace(
        '${auth_uuid}',
        Object.keys(Object.values(launcherProfiles.authenticationDatabase)[0].profiles)[0]
      );
      mcArgs = mcArgs.replace(
        '${auth_access_token}',
        Object.values(launcherProfiles.authenticationDatabase)[0].accessToken
      );
      mcArgs = mcArgs.replace('${user_type}', 'mojang');
      mcArgs = mcArgs.replace('${user_properties}', '{}');

      if (profile.getPrimaryFramework() === 'none') {
        mcArgs = mcArgs.replace('${version_type}', 'vanilla');
      } else if (profile.getPrimaryFramework() === 'fabric') {
        mcArgs = mcArgs.replace('${version_type}', 'Fabric');
      } else if (profile.getPrimaryFramework() === 'forge') {
        mcArgs = mcArgs.replace('${version_type}', 'Forge');
      }

      let finishedJavaArgs = '';

      if (!versionJSON.arguments) {
        // no arguments, we have to figure them out ourselves
        finishedJavaArgs = `-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump -Djava.library.path="${path.join(
          profile.profilePath,
          '/_mcm/natives'
        )}" -Dminecraft.client.jar="${path.join(
          VersionsManager.getVersionsPath(),
          `/${versionJSON.jar}/${versionJSON.jar}.jar`
        )}"`;
        finishedJavaArgs += ` -cp ${classpath}`;
        finishedJavaArgs += ` -Xmx8G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M`;
        finishedJavaArgs += ` ${versionJSON.mainClass}`;
        finishedJavaArgs += ` ${mcArgs}`;
      } else {
        if (versionJSON.arguments.jvm) {
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

          finishedJavaArgs += `${versionJSON.mainClass} `;
          finishedJavaArgs += mcArgs;
        }
      }

      finishedJavaArgs = finishedJavaArgs.replace('${launcher_name}', 'minecraft-launcher');
      finishedJavaArgs = finishedJavaArgs.replace('${launcher_version}', 'X');
      finishedJavaArgs = finishedJavaArgs.replace(
        '${natives_directory}',
        `"${path.join(profile.profilePath, '/_mcm/natives')}"`
      );
      finishedJavaArgs = finishedJavaArgs.replace('${classpath}', this.generateClasspath(profile, versionJSON));

      exec(`"${Global.getJavaPath()}" ${finishedJavaArgs}`, {
        cwd: profile.gameDir
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
      try {
        logger.info(`Launching ${profile.id} directly`);
        const versionJSON = await this.getVersionJSON(profile);

        logger.info(`Verifying downloaded libraries...`);
        await this.verifyDownloadedLibraries(profile, versionJSON);
        logger.info(`Downloaded libraries verification complete`);
        logger.info(`Extracting natives...`);
        await this.extractNatives(profile, versionJSON);
        logger.info(`Finished extracting natives`);
        logger.info(`Generating and running command`);
        await this.runCommand(profile, versionJSON);

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
    } else if (os.platform() === 'darwin') {
      return 'osx';
    } else if (os.platform() === 'linux') {
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

  async extractNatives(profile, versionJSON) {
    const nativesPath = path.join(profile.profilePath, '/_mcm/natives');
    if (fs.existsSync(nativesPath)) rimraf.sync(nativesPath);

    mkdirp.sync(nativesPath);

    for (let library of versionJSON.libraries) {
      if (library.natives && this.allowLibrary(library)) {
        const nativeClassifier = library.natives[this.getOSName()];

        const zip = new admzip(
          path.join(LibrariesManager.getLibrariesPath(), `/${library.downloads.classifiers[nativeClassifier].path}`)
        );
        const zipEntries = zip.getEntries();

        let allowedEntries = [];
        zipEntries.forEach(entry => {
          if (library.extract && library.extract.exclude) {
            let doAllow = true;
            let stop = false;
            for (let exclude of library.extract.exclude) {
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
          zip.extractEntryTo(entry, nativesPath, false, true);
        });
      }
    }
  },

  async verifyDownloadedLibraries(profile, versionJSON) {
    for (let library of versionJSON.libraries) {
      if (this.allowLibrary(library)) {
        const mvnPath = this.calculateMavenPath(library.name);
        if (!library.natives) {
          const libPath = path.join(LibrariesManager.getLibrariesPath(), mvnPath);
          if (!fs.existsSync(libPath)) {
            logger.info(`Library "${library.name}" is missing. Downloading it...`);
            if (!library.downloads && library.url) {
              // manually parse the downloads
              mkdirp.sync(path.dirname(libPath));

              await DownloadsManager.startFileDownload(
                `Library "${library.name}"\n_A_${profile.name}`,
                `${library.url}${mvnPath}`,
                libPath
              );
            } else if (library.downloads) {
              mkdirp.sync(path.dirname(libPath));

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
          const nativeClassifier = library.natives[this.getOSName()];
          if (library.downloads) {
            const libPath = path.join(
              LibrariesManager.getLibrariesPath(),
              library.downloads.classifiers[nativeClassifier].path
            );
            if (!fs.existsSync(libPath)) {
              logger.info(`Native library "${library.name}" is missing. Downloading it...`);

              mkdirp.sync(path.dirname(libPath));

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
  }
};

export default DirectLauncherManager;
