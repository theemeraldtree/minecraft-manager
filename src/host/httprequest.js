/* eslint-disable */
const request = require('request');
const req = require('request-promise');
const { ipcRenderer } = require('electron');
const axios = require('axios');
const qs = require('qs');

const HTTPRequest = {
  fileDownloads: {},
  httpGet(url) {
    return new Promise((resolve, reject) => {
      // Minecraft Manager explicity mentions itself during an HTTP request.
      request
        .get(
          url,
          {
            url,
            headers: {
              'X-Client': 'MinecraftManager',
              'X-Source': 'github.com/theemeraldtree/minecraft-manager'
            },
            followAllRedirects: true
          },
          (error, response, body) => {
            resolve(body, response);
          }
        )
        .on('error', err => {
          reject(err);
        });
    });
  },

  download(url, dest, onProgress) {
    return new Promise(resolve => {
      const id = `${url}-${dest}`;
      this.fileDownloads[id] = {
        onProgress,
        onFinish: resolve
      };
      ipcRenderer.send('download-file', url, dest, id);
    });
  },

  fileDownloadProgress(download) {
    if (this.fileDownloads[download.id]) {
      this.fileDownloads[download.id].onProgress(download.progress);
    }
  },

  fileDownloadFinish(download) {
    if (this.fileDownloads[download.id]) {
      this.fileDownloads[download.id].onFinish();
    }
  },

  async get(url, querystring) {
    return axios.get(url, {
      params: querystring,
      headers: {
        'X-Client': 'MinecraftManager',
        'X-Source': 'github.com/theemeraldtree/minecraft-manager'
      },
      timeout: 15000
    });
  },

  async post(url, body) {
    return req({
      uri: url,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        'X-Client': 'MinecraftManager',
        'X-Source': 'github.com/theemeraldtree/minecraft-manager'
      }
    });
  }
};

export default HTTPRequest;
