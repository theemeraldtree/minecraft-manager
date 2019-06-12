const request = require('request');
const cheerio = require('cheerio');

let HTTPRequest = {
    httpGet(url) {
        return new Promise((resolve, reject) => {

            // Minecraft Manager explicity mentions itself during an HTTP request. If you are the owner of a site we sue (such as Curse)
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
                resolve(cheerio.load(response.replace(/\s\s+/g, ' ')));
            }).catch((err) => {
                reject(err);
            })
        })
    }    
}

export default HTTPRequest;