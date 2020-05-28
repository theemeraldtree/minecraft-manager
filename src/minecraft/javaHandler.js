import os from 'os';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import SettingsManager from '../manager/settingsManager';
import HTTPRequest from '../host/httprequest';
import Global from '../util/global';
import DownloadsManager from '../manager/downloadsManager';

/* eslint-disable */
const JavaHandler = {
  /**
   * Gets the Java Path for the requested profile
   * If no profile is given, the default global
   * setting will be used
   * @param {object} [profile] - The profile to use
   */
  getJavaPath(profile) {
    if (profile && profile.mcm.java?.override) {

    } else {
      if(SettingsManager.currentSettings.java.manual) {
        return SettingsManager.currentSettings.java.manualPath;
      }

      return SettingsManager.currentSettings.java.path;
    }
  },

  async getJavaVersionsForInstaller() {
    const javaVersions = await this.getJavaVersions();
    return javaVersions.map(( ver, index) => ({ status: index === 0 ? 'Latest': '', name: ver.release_name}))
  },

  /**
   * Gets the list of AdoptOpenJDK 8 Binaries
   */
  async getJavaVersions() {
    const architecture = os.arch();
    let osName = 'windows';
    if(os.platform() === 'darwin') osName = 'mac';
    if(os.platform() === 'linux') osName = 'linux';

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
    }

    const res = (await HTTPRequest.get(`https://api.adoptopenjdk.net/v3/assets/feature_releases/8/ga`, qs)).data;
    return res;
  },

  installVersion(version, to) {
    return new Promise(async resolve => {
      const arch = os.arch();
      let osName = 'windows';
      if(os.platform() === 'darwin') osName = 'mac';
      if(os.platform() === 'linux') osName = 'linux';
  
      let url;
      if(version === 'latest') {
        url = `https://api.adoptopenjdk.net/v3/binary/latest/8/ga/${osName}/${arch}/jre/hotspot/normal/adoptopenjdk`;
      } else {
        url = `https://api.adoptopenjdk.net/v3/binary/version/${version}/${osName}/${arch}/jre/hotspot/normal/adoptopenjdk`;
      }
  
      const tempPath = path.join(Global.MCM_TEMP, `/java-install-${new Date().getTime()}.zip`);
      await DownloadsManager.startFileDownload(`Java ${version}`, url, tempPath);
      
      const tempExtract = path.join(Global.MCM_TEMP, `/java-extract-${new Date().getTime()}`);

      const zip = new AdmZip(tempPath);
      zip.extractEntryTo(zip.getEntries()[0].entryName, tempExtract, true, true);

      fs.readdir(tempExtract, (e, files) => {
        if(fs.existsSync(to)) rimraf.sync(to);
        fs.rename(path.join(tempExtract, files[0]), to, () => {
          fs.unlinkSync(tempPath);
  
          resolve(files[0]);
        });
      })
    });
  }
}

export default JavaHandler;
