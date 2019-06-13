const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
let HTTPRequest = {
    httpGet(url) {
        return new Promise((resolve, reject) => {

            // Minecraft Manager explicity mentions itself during an HTTP request. 
            request.get(url, {
                url: url,
                headers: {
                    'User-Agent': 'Minecraft-Manager'
                }
            }, (error, response, body) => {
                resolve(body, response);
            }).on('error', (err) => {
                reject(err);
            });
        });
    },

    cheerioRequest(url) {
        return new Promise((resolve, reject) => {
            this.httpGet(url).then((response) => {
                if(response == undefined) {
                    this.cheerioRequest(url);
                }
                resolve(cheerio.load(response.replace(/\s\s+/g, ' ')));
            }).catch((err) => {
                reject(err);
            })
        })
    },

    download(url, dest, onProgress) {
        return new Promise((resolve, reject) => {
            let progressData = 0;
            let contentLength = 0;
            let ws = fs.createWriteStream(dest);
            let req = request(url, {
                url: url,
                headers: {
                    'User-Agent': 'Minecraft-Manager'
                }
            });
            req.on('data', (data) => {
                if(onProgress) {
                    progressData += data.length;
                    onProgress(Math.trunc((progressData / contentLength) * 100));
                }
            })
            req.on('response', (res) => {
                contentLength = res.headers['content-length'];
                res.pipe(ws);
                ws.on('finish', () => {
                    resolve();
                    ws.end();
                })
            })
            req.on('error', () => {
                ws.end();
                reject();
            })
        })
    }
}

export default HTTPRequest;