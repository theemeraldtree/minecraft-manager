import HTTPRequest from "../host/httprequest";
import Download from "../type/download";
import path from 'path';
import Global from '../util/global';
import LogManager from "./logManager";
import fs from 'fs';

const DownloadsManager = {
    activeDownloads: [],
    downloadUpdateFunc: null,
    startFileDownload: function(downloadName, file, path, tries) {
        return new Promise((resolve, reject) => {
            if(file) {
                let download = new Download(downloadName, file, path);
                this.activeDownloads.push(download);
                if(this.onDownload) {
                    this.downloadUpdate();
                }
                HTTPRequest.download(file, path, (progress) => {
                    this.handleDownloadProgress(download, progress);
                }).then(() => {
                    this.activeDownloads.splice(this.activeDownloads.indexOf(download), 1);
                    this.downloadUpdate();
                    resolve();
                }).catch(() => {
                    if(tries === 3) {
                        reject('try-limit');
                    }else{
                        this.activeDownloads.splice(this.activeDownloads.indexOf(download), 1);
                        this.startFileDownload(downloadName, file, path, tries++).then((res) => {
                            resolve(res);
                        }).catch(() => {
                            if(tries++ >= 3) {
                                reject();
                            }
                        })
                    }
                })
            }else{
                LogManager.log('severe', '[DownloadsManager] [StartFileDownload] Missing file download path!');
            }
        })
    },
    removeDownload: function(downloadName) {
        for(let download of this.activeDownloads) {
            if(download.name === downloadName) {
                this.activeDownloads.splice(this.activeDownloads.indexOf(download), 1);
            }
        }
        this.downloadUpdate();
    },
    createProgressiveDownload: function(downloadName) {
        return new Promise((resolve) => {
            let download = new Download(downloadName, 'None', 'None');
            this.activeDownloads.push(download);

            this.downloadUpdate();
            resolve(download);
        })
    },
    setDownloadProgress: function(downloadName, progress) {
        const download = this.activeDownloads.find((item) => (
            downloadName === item.name
        ));
        this.handleDownloadProgress(download, progress);
    },
    handleDownloadProgress: function(download, progress) {
        download.setProgress(`${progress}%`);
        download.setProgressPercent(progress);
        this.downloadUpdate();
    },
    startAssetDownload: function(profile, mod, type, url, modpack) {
        return new Promise((resolve) => {
            let downloadPath;
            if(type === 'mod') {
                if(!fs.existsSync(path.join(profile.gameDir, '/mods'))) {
                    fs.mkdirSync(path.join(profile.gameDir, '/mods'));
                }
                downloadPath = path.join(profile.modsPath, `/${Global.createID(mod.name)}.jar`);
            }else if(type === 'resourcepack') {
                if(!fs.existsSync(path.join(profile.gameDir, `/resourcepacks`))) {
                    fs.mkdirSync(path.join(profile.gameDir, `/resourcepacks`));
                }
                downloadPath = path.join(profile.gameDir, `/resourcepacks/${Global.createID(mod.name)}.zip`);
            }
            if(modpack === false) {
                this.startFileDownload(
                    `${mod.name}\n_A_${profile.name}`, 
                    url, 
                    downloadPath
                    ).then(() => {
                    resolve();
                })
            }
        })
    },
    downloadUpdate: function() {
        this.downloadUpdateFunc(this.activeDownloads);
    },
    registerDownloadsViewer: function(downloadUpdate) {
        this.downloadUpdateFunc = downloadUpdate;
        this.downloadUpdate(this.activeDownloads);
    }
}

export default DownloadsManager;