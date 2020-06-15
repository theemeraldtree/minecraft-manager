import path from 'path';
import HTTPRequest from '../host/httprequest';
import Download from '../type/download';
import Global from '../util/global';
import logInit from '../util/logger';
import FSU from '../util/fsu';
import Scanner from '../util/scanner/scanner';

const logger = logInit('DownloadsManager');

const DownloadsManager = {
  activeDownloads: [],
  downloadUpdateFunc: null,
  startFileDownload(downloadName, file, downloadPath, opts) {
    return new Promise((resolve, reject) => {
      if (file) {
        const download = new Download(downloadName, file, downloadPath, opts);
        this.activeDownloads.push(download);
        if (this.onDownload) {
          this.downloadUpdate();
        }

        HTTPRequest.downloadInline(file, downloadPath, progress => {
          this.handleDownloadProgress(download, progress);
        }, opts)
          .then(() => {
            this.activeDownloads.splice(this.activeDownloads.indexOf(download), 1);
            this.downloadUpdate();
            resolve();
          })
          .catch((e) => {
            this.activeDownloads.splice(this.activeDownloads.indexOf(download), 1);
            this.downloadUpdate();
            reject(e);
          });
      } else {
        logger.error('Missing file download path');
      }
    });
  },
  removeDownload(downloadName) {
    this.activeDownloads.splice(
      this.activeDownloads.findIndex(download => download.name === downloadName),
      1
    );
    this.downloadUpdate();
  },
  createProgressiveDownload(downloadName) {
    return new Promise(resolve => {
      const download = new Download(downloadName, 'None', 'None');
      this.activeDownloads.push(download);

      this.downloadUpdate();
      resolve(download);
    });
  },
  setDownloadProgress(downloadName, progress) {
    const download = this.activeDownloads.find(item => downloadName === item.name);

    if (download) {
      this.handleDownloadProgress(download, progress);
    }
  },
  handleDownloadProgress(download, progress) {
    download.setProgress(`${progress}%`);
    download.setProgressPercent(progress);
    this.downloadUpdate();
  },
  startAssetDownload(profile, mod, type, url, modpack) {
    return new Promise((resolve, reject) => {
      let downloadPath, fileName;
      if (mod.hosts.curse) fileName = mod.hosts.curse.fileName;
      if (type === 'mod') {
        FSU.createDirIfMissing(profile.modsPath);

        downloadPath = path.join(profile.modsPath, fileName);
      } else if (type === 'resourcepack') {
        FSU.createDirIfMissing(path.join(profile.gameDir, 'resourcepacks'));

        downloadPath = path.join(profile.gameDir, `/resourcepacks/${fileName}`);
      } else if (type === 'world') {
        FSU.createDirIfMissing(path.join(profile.gameDir, 'saves'));
        FSU.createDirIfMissing(path.join(Global.MCM_TEMP, 'world-install'));


        downloadPath = path.join(Global.MCM_TEMP, `/world-install/${Global.createID(mod.name)}-world-install.zip`);
      }
      if (modpack === false) {
        this.startFileDownload(`${mod.name}\n_A_${profile.name}`, url, downloadPath)
          .then(async () => {
            if (type === 'world') {
              await Scanner.worlds.importWorld(profile, downloadPath, false, mod.id);
            }

            resolve();
          })
          .catch(() => {
            reject();
          });
      }
    });
  },
  downloadUpdate() {
    this.downloadUpdateFunc(this.activeDownloads);
  },
  registerDownloadsViewer(downloadUpdate) {
    this.downloadUpdateFunc = downloadUpdate;
    this.downloadUpdate(this.activeDownloads);
  }
};

export default DownloadsManager;
