import FileUtils from '../util/fileUtils';
const defVerison = require('json-loader!../assets/json/defaultVersion.json');
const version1710 = require('json-loader!../assets/json/version1.7.10.json');
const path = require('path');
const http = require('http');
const fs = require('fs');
class MinecraftVersionManager {
    constructor() {
        if(fs.existsSync(FileUtils.getAppPath())) {
            this.versionFolder = path.join(FileUtils.getMCFolder(), '/versions');
            this.libraryFolder = path.join(FileUtils.getMCFolder(), '/libraries');
        }
    }
    
    createForgeLibrary(id, mcVer, forgeVer, p, callback) {
        if(!fs.existsSync(p)) {
            fs.mkdirSync(p);
        }
        
        // DOWNLOAD THE UNIVERSAL FORGE VERSION AND PLACE IT HERE
        this.downloadForge(mcVer, forgeVer, path.join(p, '/profiles-' + id + '.jar'), () => {
            callback();
        })
    }
    downloadForge(mcVer, forgeVer, targetPath, callback) {
        let fileUrl;
        if(mcVer.substring(0,3) == '1.8' || mcVer.substring(0,3) == '1.7') {
            fileUrl = `http://files.minecraftforge.net/maven/net/minecraftforge/forge/${forgeVer}-${mcVer}/forge-${forgeVer}-${mcVer}-universal.jar`;   
        }else{
            fileUrl = `http://files.minecraftforge.net/maven/net/minecraftforge/forge/${forgeVer}/forge-${forgeVer}-universal.jar`;            
        }
        console.log(fileUrl);
        var file = fs.createWriteStream(targetPath);
       http.get(fileUrl, (response) => {
            response.pipe(file);
            file.on('finish', ()=> {
                file.end();
                callback();
            })
        });
    }
    getForgeVersion(mcVer, callback) {
        http.get('http://files.minecraftforge.net/maven/net/minecraftforge/forge/json', (resp) => {
            var bodyChunks = []; 
            resp.on('data', function(chunk) {
              // You can process streamed parts here...
              bodyChunks.push(chunk);
            })
            resp.on('end', function() {
              var body = Buffer.concat(bodyChunks).toString();
              var obj = JSON.parse(body);


              console.log('FORGE VER: ' + mcVer + '-' + obj.number[obj.promos[mcVer + '-latest']].version);
              callback(mcVer + '-' + obj.number[obj.promos[mcVer + '-latest']].version);
            });           
        })
    }
    getForgeVersions(mcVer) {
        return new Promise((resolve) => {
            http.get(`http://files.minecraftforge.net/maven/net/minecraftforge/forge/json`, (resp) => {
                let bodyChunks = [];
                resp.on('data', (chunk) => {
                    bodyChunks.push(chunk);
                });

                resp.on('end', () => {
                    let body = Buffer.concat(bodyChunks).toString();
                    let obj = JSON.parse(body);

                    let versions = [];

                    for(let versionIndex of obj.mcversion[mcVer]) {
                        let version = obj.number[versionIndex].version;
                        versions.push(version);
                    }

                    versions.reverse();

                    resolve(versions);
                })
            })
        })
    }
    getVersions() {
        return [
            '1.12.2', 
            '1.12.1', 
            '1.12', 
            '1.11.2',
            '1.11.1',
            '1.11', 
            '1.10.2',
            '1.10.1',
            '1.10', 
            '1.9.4',
            '1.9.3',
            '1.9.2',
            '1.9.1', 
            '1.9', 
            '1.8.9', 
            '1.8.8',
            '1.8.7',
            '1.8.6',
            '1.8.5',
            '1.8.4',
            '1.8.3',
            '1.8.2',
            '1.8.1', 
            '1.8', 
            '1.7.10',
            '1.7.9',
            '1.7.8',
            '1.7.7',
            '1.7.6',
            '1.7.5',
            '1.7.4',
            '1.7.2',
            '1.6.4',
            '1.6.2',
            '1.6.1',
            '1.5.2',
            '1.5.1',
            '1.5',
            '1.4.7',
            '1.4.6',
            '1.4.5',
            '1.4.4',
            '1.4.2',
            '1.3.2',
            '1.3.1',
            '1.2.5',
            '1.2.4',
            '1.2.3',
            '1.2.2',
            '1.2.1',
            '1.1',
            '1.0'
        ];
    }
    createVersion(mcVer, name, id, callback) {
        let obj;
        if(mcVer != '1.7.10') {
            obj = defVerison;            
        }else{
            obj = version1710;
        }
        obj['id'] = name;
        obj['inheritsFrom'] = mcVer;
        obj['jar'] = mcVer;
        obj.libraries[0].name = 'minecraftmanager:profiles:' + id;

        if(!fs.existsSync(path.join(this.versionFolder, '/' + id))) {
            fs.mkdirSync(path.join(this.versionFolder, '/' + id));
        }

        var str = JSON.stringify(obj);

        fs.writeFile(path.join(this.versionFolder, '/' + id + '/' + id + '.json',), str, () => {
            callback();
        });
    }
}

export default new MinecraftVersionManager();