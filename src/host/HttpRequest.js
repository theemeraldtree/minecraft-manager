const request = require('request');
const cheerio = require("cheerio");

class HttpRequest {
    static httpGet(url) {
        return new Promise((resolve, reject) => {
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
    }

    static cheerioRequest(url) {
        return new Promise((resolve, reject) => {
            this.httpGet(url).then((response) => {
                console.log(response);
                resolve(cheerio.load(response.replace(/\s\s+/g, ' ')));
            }).catch((err) => {
                reject(err);
            })
        })
    }    
}

export default HttpRequest;