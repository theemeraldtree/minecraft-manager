import HTTPRequest from "../host/httprequest";
import Download from "../type/download";

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
                this.downloadUpdate();
                download.setProgress(`${progress}%`);
                download.setProgressPercent(progress)
            }).then(() => {
                this.activeDownloads.splice(this.activeDownloads.indexOf(download), 1);
                this.downloadUpdate();
                resolve();
            });
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