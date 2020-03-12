import path from 'path';
import fs from 'fs';
import HTTPRequest from '../host/httprequest';
import Download from '../type/download';
import Global from '../util/global';
import LogManager from './logManager';

const DownloadsManager = {
  activeDownloads: [],
  downloadUpdateFunc: null,
  startFileDownload(downloadName, file, downloadPath, tries) {
    return new Promise((resolve, reject) => {
      if (file) {
        const download = new Download(downloadName, file, downloadPath);
        this.activeDownloads.push(download);
        if (this.onDownload) {
          this.downloadUpdate();
        }
        HTTPRequest.download(file, downloadPath, progress => {
          console.log('httpREQUEST CALL');
          console.log(download);
          this.handleDownloadProgress(download, progress);
        })
          .then(() => {
            this.activeDownloads.splice(this.activeDownloads.indexOf(download), 1);
            this.downloadUpdate();
            resolve();
          })
          .catch(() => {
            if (tries === 3) {
              reject(new Error('try-limit'));
            } else {
              this.activeDownloads.splice(this.activeDownloads.indexOf(download), 1);
              this.startFileDownload(downloadName, file, downloadPath, tries + 1)
                .then(res => {
                  resolve(res);
                })
                .catch(() => {
                  if (tries + 1 >= 3) {
                    reject();
                  }
                });
            }
          });
      } else {
        LogManager.log('severe', '[DownloadsManager] [StartFileDownload] Missing file download path!');
      }
    });
  },
  removeDownload(downloadName) {
    this.activeDownloads.splice(this.activeDownloads.find(download => download.name === downloadName));
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
    console.log(download);
    download.setProgress(`${progress}%`);
    download.setProgressPercent(progress);
    this.downloadUpdate();
  },
  startAssetDownload(profile, mod, type, url, modpack) {
    return new Promise(resolve => {
      let downloadPath;
      if (type === 'mod') {
        if (!fs.existsSync(path.join(profile.gameDir, '/mods'))) {
          fs.mkdirSync(path.join(profile.gameDir, '/mods'));
        }
        downloadPath = path.join(profile.modsPath, `/${Global.createID(mod.name)}.jar`);
      } else if (type === 'resourcepack') {
        if (!fs.existsSync(path.join(profile.gameDir, '/resourcepacks'))) {
          fs.mkdirSync(path.join(profile.gameDir, '/resourcepacks'));
        }
        downloadPath = path.join(profile.gameDir, `/resourcepacks/${Global.createID(mod.name)}.zip`);
      }
      if (modpack === false) {
        this.startFileDownload(`${mod.name}\n_A_${profile.name}`, url, downloadPath).then(() => {
          resolve();
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
