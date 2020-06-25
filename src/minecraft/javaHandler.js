import os from 'os';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import tar from 'tar';
import mkdirp from 'mkdirp';
import SettingsManager from '../manager/settingsManager';
import HTTPRequest from '../host/httprequest';
import Global from '../util/global';
import DownloadsManager from '../manager/downloadsManager';
import ToastManager from '../manager/toastManager';
import ErrorManager from '../manager/errorManager';
import logInit from '../util/logger';

const JavaHandler = {
  logger: logInit('JavaHandler'),
  /**
   * Gets the Java Path for the requested profile
   * If no profile is given, the default global
   * setting will be used
   * @param {object} [profile] - The profile to use
   */
  getJavaPath(profile) {
    if (profile && profile.mcm.java && profile.mcm.java.overridePath) {
      if (profile.mcm.java.manual) {
        return profile.mcm.java.manualPath;
      }

      return profile.mcm.java.path;
    }
      if (SettingsManager.currentSettings.java.manual) {
        return SettingsManager.currentSettings.java.manualPath;
      }

      return SettingsManager.currentSettings.java.path;
  },

  async getJavaVersionsForInstaller() {
    const javaVersions = await this.getJavaVersions();
    return javaVersions.map((ver, index) => ({ status: index === 0 ? 'Latest' : '', name: ver.release_name }));
  },

  /**
   * Gets the list of AdoptOpenJDK 8 Binaries
   */
  async getJavaVersions() {
    const architecture = os.arch();
    let osName = 'windows';
    if (os.platform() === 'darwin') osName = 'mac';
    if (os.platform() === 'linux') osName = 'linux';

    const qs = {
      architecture,
      heap_size: 'normal',
      image_type: 'jre',
      jvm_impl: 'hotspot',
      os: osName,
      page: 0,
      page_size: 20,
      project: 'jdk',
      sort_order: 'DESC',
      vendor: 'adoptopenjdk'
    };

    const res = (await HTTPRequest.get('https://api.adoptopenjdk.net/v3/assets/feature_releases/8/ga', qs)).data;
    return res;
  },

  installVersion(version, to) {
    return new Promise(async resolve => {
      const arch = os.arch();
      let osName = 'windows';
      if (os.platform() === 'darwin') osName = 'mac';
      if (os.platform() === 'linux') osName = 'linux';

      let url;
      if (version === 'latest') {
        url = `https://api.adoptopenjdk.net/v3/binary/latest/8/ga/${osName}/${arch}/jre/hotspot/normal/adoptopenjdk`;
      } else {
        url = `https://api.adoptopenjdk.net/v3/binary/version/${version}/${osName}/${arch}/jre/hotspot/normal/adoptopenjdk`;
      }

      let ext = 'zip';
      if (osName === 'mac' || osName === 'linux') ext = 'tar.gz';

      const tempPath = path.join(Global.MCM_TEMP, `/java-install-${new Date().getTime()}.${ext}`);


      DownloadsManager.startFileDownload(`Java ${version}`, url, tempPath, {
        disableErrorToast: true
      }).then(() => setTimeout(() => {
        const tempExtract = path.join(Global.MCM_TEMP, `/java-extract-${new Date().getTime()}`);

        if (ext === 'zip') {
          const zip = new AdmZip(tempPath);
          zip.extractEntryTo(zip.getEntries()[0].entryName, tempExtract, true, true);
        } else if (ext === 'tar.gz') {
          mkdirp.sync(tempExtract);
          tar.extract({
            gzip: true,
            file: tempPath,
            sync: true,
            cwd: tempExtract
          }, []);
        }

        fs.readdir(tempExtract, (e, files) => {
          try {
            if (fs.existsSync(to)) rimraf.sync(to);
            const fileName = osName === 'mac' ? files[1] : files[0];
            fs.rename(path.join(tempExtract, fileName), to, () => {
              fs.unlinkSync(tempPath);

              if (version === 'latest') {
                resolve(files[0]);
              } else {
                resolve(version);
              }
            });
        } catch (error) {
          this.logger.error(`Unable to install Java: ${error.toString()}`);
          ToastManager.createToast('Unable to install Java', ErrorManager.makeReadable(error, 'java'));
          resolve('error');
        }
        });
      }, 300)
      ).catch((e) => {
        this.logger.error(`Unable to download Java: ${e.toString()}`);
        if (fs.existsSync(Global.PROFILES_PATH)) {
          ToastManager.createToast('Unable to download Java', 'Check your internet connection, and try again');
        }
        resolve('error');
      });
    });
  },
  getDefaultJavaPath() {
    if (os.platform() === 'darwin') {
      return '/Contents/Home/bin/java';
    } if (os.platform() === 'win32') {
      return '/bin/javaw.exe';
    } if (os.platform() === 'linux') {
      return '/bin/java';
    }

    return '/bin/javaw.exe';
  },
};

export default JavaHandler;
