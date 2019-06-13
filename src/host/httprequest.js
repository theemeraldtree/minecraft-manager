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

    download(url, dest) {
        return new Promise((resolve, reject) => {
            let ws = fs.createWriteStream(dest);
            let req = request(url, {
                url: url,
                headers: {
                    'User-Agent': 'Minecraft-Manager'
                }
            });
            req.on('response', (res) => {
                res.pipe(fs.createWriteStream(dest));
                ws.on('finish', () => {
                    resolve();
                    fs.close(ws);
                })
            })
            req.on('error', () => {
                reject();
            })
        })
    }
}

export default HTTPRequest;