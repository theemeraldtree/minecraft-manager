const request = require('request');
const req = require('request-promise');
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
                },
                followAllRedirects: true
            }, (error, response, body) => {
                resolve(body, response);
            }).on('error', (err) => {
                reject(err);
            });
        });
    },

    cheerioRequest(url, tries) {
        return new Promise((resolve, reject) => {
            this.httpGet(url).then((response) => {
                if(response == undefined) {
                    this.cheerioRequest(url);
                }

                if(response) {
                    resolve(cheerio.load(response.replace(/\s\s+/g, ' ')));
                }else{
                    reject('response-not-found', tries);
                }
            }).catch((err) => {
                reject(err, tries);
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
                },
                followAllRedirects: true
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
                })
            })
            req.on('error', () => {
                ws.end();
                reject();
            })
        })
    },

    async get(url, qs) {
        return await req({
            uri: url,
            method: 'GET',
            qs: qs,
            headers: {
                'User-Agent': 'MinecraftManagerClient'
            }
        })
    },

    async post(url, body) {
        let res = await req({
            uri: url,
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'content-type': 'application/json',
                'User-Agent': 'MinecraftManagerClient'
            }
        })

        return res;
    }
}

export default HTTPRequest;