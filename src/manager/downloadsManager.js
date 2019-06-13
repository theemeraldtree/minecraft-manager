import HTTPRequest from "../host/httprequest";
import Download from "../type/download";
import path from 'path';
import Global from '../util/global';

const DownloadsManager = {
    activeDownloads: [],
    downloadUpdateFunc: null,
    startFileDownload: function(downloadName, file, path) {
        return new Promise((resolve) => {
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
            });
        })
    },
    handleDownloadProgress: function(download, progress) {
        this.downloadUpdate();
        download.setProgress(`${progress}%`);
        download.setProgressPercent(progress)
    },
    startModDownload: function(profile, mod, url, modpack) {
        return new Promise((resolve) => {
            if(modpack === false) {
                this.startFileDownload(`${mod.name} to ${profile.name}`, url, path.join(profile.modsPath, `/${Global.createID(mod.name)}.jar`)).then(() => {
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