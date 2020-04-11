import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import Global from '../util/global';
import ProfilesManager from './profilesManager';
import DownloadsManager from './downloadsManager';
import logInit from '../util/logger';

const logger = logInit('LibrariesManager');

const LibrariesManager = {
  getLibrariesPath() {
    return path.join(Global.getMCPath(), '/libraries/');
  },
  getMCMLibraries() {
    return path.join(this.getLibrariesPath(), '/minecraftmanager/profiles/');
  },
  createLibraryPath(profile) {
    logger.info(`Creating Library path for ${profile.id}`);
    this.checkExist();
    const p = path.join(this.getMCMLibraries(), `/mcm-${profile.id}`);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p);
    }

    return p;
  },
  dumpAllLibraries() {
    const ret = [];
    fs.readdirSync(this.getMCMLibraries()).forEach(file => {
      ret.push(file);
    });

    return ret;
  },
  checkExist() {
    const mcmpath = path.join(this.getLibrariesPath(), '/minecraftmanager');
    if (!fs.existsSync(mcmpath)) {
      fs.mkdirSync(mcmpath);
    }
    if (!fs.existsSync(this.getMCMLibraries())) {
      fs.mkdirSync(this.getMCMLibraries());
    }
  },
  renameLibrary(profile, newID) {
    if (profile.frameworks.forge || profile.frameworks.fabric) {
      // old library method check
      const profileLibrary = path.join(this.getMCMLibraries(), `/mcm-${profile.id}`);
      if (fs.existsSync(path.join(profileLibrary, `/profiles-mcm-${profile.id}.jar`))) {
        fs.renameSync(
          path.join(profileLibrary, `/profiles-mcm-${profile.id}.jar`),
          path.join(profileLibrary, `/profiles-mcm-${newID}.jar`)
        );
      } else if (profile.frameworks.fabric) {
        fs.renameSync(
          path.join(profileLibrary, `/fabric-intermediary/mcm-${profile.id}-fabric-intermediary.jar`),
          path.join(profileLibrary, `/fabric-intermediary/mcm-${newID}-fabric-intermediary.jar`)
        );
        fs.renameSync(
          path.join(profileLibrary, `/fabric-loader/mcm-${profile.id}-fabric-loader.jar`),
          path.join(profileLibrary, `/fabric-loader/mcm-${newID}-fabric-loader.jar`)
        );
      } else if (profile.frameworks.forge) {
        fs.renameSync(
          path.join(profileLibrary, `/forge/mcm-${profile.id}-forge.jar`),
          path.join(profileLibrary, `/forge/mcm-${newID}-forge.jar`)
        );
      }

      fs.renameSync(profileLibrary, path.join(this.getMCMLibraries(), `/mcm-${newID}`));
    }
  },
  deleteLibrary(profile) {
    return new Promise(resolve => {
      logger.info(`Deleting Library for ${profile.id}`);
      const libraryPath = path.join(this.getMCMLibraries(), `/mcm-${profile.id}`);
      if (fs.existsSync(libraryPath)) {
        rimraf(libraryPath, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  },
  cleanLibraries() {
    logger.info('Cleaning libraries...');
    fs.readdirSync(this.getMCMLibraries()).forEach(file => {
      if (file.substring(0, 4) === 'mcm-') {
        if (!ProfilesManager.loadedProfiles.find(prof => file === `mcm-${prof.id}`)) {
          rimraf.sync(path.join(this.getMCMLibraries(), file));
          logger.info(`Removed library ${file}`);
        }
      }
    });
  },
  // sometimes there are missing libraries
  checkMissingLibraries() {
    const akkaactorpath = path.join(
      this.getLibrariesPath(),
      '/com/typesafe/akka/akka-actor_2.11/2.3.3/akka-actor_2.11-2.3.3.jar'
    );
    const typesafeconfigpath = path.join(this.getLibrariesPath(), '/com/typesafe/config/1.2.1/config-1.2.1.jar');
    const asmallpath = path.join(this.getLibrariesPath(), '/org/ow2/asm/asm-all/5.2/asm-all-5.2.jar');
    mkdirp.sync(path.dirname(akkaactorpath));
    mkdirp.sync(path.dirname(typesafeconfigpath));
    mkdirp.sync(path.dirname(asmallpath));
    if (!fs.existsSync(akkaactorpath)) {
      DownloadsManager.startFileDownload(
        'Missing essential library akka-actor',
        'https://repo1.maven.org/maven2/com/typesafe/akka/akka-actor_2.11/2.3.3/akka-actor_2.11-2.3.3.jar',
        akkaactorpath
      );
    }
    if (!fs.existsSync(typesafeconfigpath)) {
      DownloadsManager.startFileDownload(
        'Missing essential library config',
        'https://repo.maven.apache.org/maven2/com/typesafe/config/1.2.1/config-1.2.1.jar',
        typesafeconfigpath
      );
    }
    if (!fs.existsSync(asmallpath)) {
      DownloadsManager.startFileDownload(
        'Missing essential library asm-all',
        'https://repo.maven.apache.org/maven2/org/ow2/asm/asm-all/5.2/asm-all-5.2.jar',
        asmallpath
      );
    }
  }
};

export default LibrariesManager;
