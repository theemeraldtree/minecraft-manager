import fs from 'fs';
import axios from 'axios';
import adapter from 'axios/lib/adapters/http';
import ToastManager from '../manager/toastManager';

const { ipcRenderer } = require('electron');

const HTTPRequest = {
  fileDownloads: {},

  /**
   * Downloads a file to a destination on disk
   * @param {string} url - Where to Download From
   * @param {string} dest - The Destination of the download
   * @param {function} onProgress - Called when progress occurs during download
   */
  download(url, dest, onProgress, opts) {
    return new Promise((resolve, reject) => {
      const id = `${url}-${dest}`;
      this.fileDownloads[id] = {
        onProgress,
        onFinish: resolve,
        onError: reject
      };
      Object.assign(this.fileDownloads[id], opts);
      ipcRenderer.send('download-file', url, dest, id);
    });
  },

  downloadInline(url, dest) {
    return new Promise(async (resolve, reject) => {
      const { data } = await axios.get(url, {
        responseType: 'stream',
        headers: {
          'X-Client': 'MinecraftManager'
        },
        adapter
      });

      const ws = fs.createWriteStream(dest);

      data.pipe(ws);

      data.on('error', e => {
        reject(e);
      });

      data.on('end', () => {
        ws.end();
        resolve();
      });
    });
  },

  /**
   * Download progress occurs
   * @param {object} download - The Download Object
   */
  fileDownloadProgress(download) {
    if (this.fileDownloads[download.id]) {
      this.fileDownloads[download.id].onProgress(download.progress);
    }
  },

  /**
   * A file has finished downloading
   * @param {object} download - The Download Object
   */
  fileDownloadFinish(download) {
    if (this.fileDownloads[download.id]) {
      this.fileDownloads[download.id].onFinish();
    }
  },

  /**
   * A file has errored in downloading
   * @param {obj} data - The data
   */
  fileDownloadError(data) {
    if (this.fileDownloads[data.id]) {
      this.fileDownloads[data.id].onError();
      if (!this.fileDownloads[data.id].disableErrorToast) {
        ToastManager.createToast('Error', `Error downloading something. It has been skipped. ID: ${data.id}`);
      }
    } else {
      ToastManager.createToast('Error', `Error downloading something. It has been skipped. ID: ${data.id}`);
    }
  },

  /**
   * Performs an HTTP GET request to the specified URL
   * @param {string} url - The URL to perform the GET request
   * @param {string} querystring - Query String
   */
  async get(url, querystring) {
    return axios.get(url, {
      params: querystring,
      headers: {
        'X-Client': 'MinecraftManager'
      },
      timeout: 15000
    });
  },

  /**
   * Performs an HTTP POST request to the specified URL with a JSON body
   * @param {string} url - The URL to perform the POST request
   * @param {object} body - The POST parameters in a JSON object
   */
  async post(url, body) {
    return axios.post(url, body, {
      headers: {
        'X-Client': 'MinecraftManager'
      }
    });
  }
};

export default HTTPRequest;
