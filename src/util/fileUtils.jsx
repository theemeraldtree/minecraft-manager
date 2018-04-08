import {remote} from 'electron';
import path from 'path'
import UserSettings from './userSettings';
import fs from 'fs';
import rimraf from 'rimraf';
const os = window.require("os");
const copyfilesync = require('fs-copy-file-sync');
const process = require('process');
const FileUtils = {
    getMCFolder()  {
        return UserSettings.readOption("minecraftHome");
    },
    isSetup() {
        console.log('NO?');
        return fs.existsSync(path.join(this.getAppPath(), `/options.json`));
    },
    getAppPath() {
        return path.join(remote.app.getPath('appData'), '/Minecraft Manager');        
    },
    getResourcesPath() {
        let dev = false;
        if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
            dev = true;
        }
        console.log( path.join(remote.app.getAppPath(), `../resource`));
        if(dev) {
            return path.join('resource');
        }else{
            if(os.platform() === 'win32' || os.platform() === 'darwin') {
                return path.join(remote.app.getAppPath(), `../resource`);
            }else{
                return null;
            }
        }

    },
    copyFile(src, target) {
        return new Promise((resolve) => {     
            copyfilesync(src, target);   
            resolve();
            // var rd = fs.createReadStream(src);
            // rd.on("error", function(err) {
            //     done(err);
            // });
            // var wr = fs.createWriteStream(target);
            // wr.on("error", function(err) {
            //     done(err);
            // });
            // wr.on("close", function() {
            //     done();
            // });
            // rd.pipe(wr);
        
            // function done() {
            //     resolve();
            // }
        })

    },
    mkdir(dir) {
        // making directory without exception if exists
        try {
            fs.mkdirSync(dir);
        } catch(e) {
            if(e.code != "EEXIST") {
                throw e;
            }
        }
    },
    delete(file) {
        let stat = fs.lstatSync(file);
        if(stat.isDirectory()) {
            rimraf(file, () => {});
        }else{
            fs.unlinkSync(file);
        }
    },
    rmdir(dir) {
        if (fs.existsSync(dir)) {
            var list = fs.readdirSync(dir);
            for(var i = 0; i < list.length; i++) {
                var filename = path.join(dir, list[i]);
                var stat = fs.lstatSync(filename);
                
                if(filename == "." || filename == "..") {
                    // pass these files
                } else if(stat.isDirectory()) {
                    // rmdir recursively
                    this.rmdir(filename);
                } else {
                    // rm fiilename
                    fs.unlinkSync(filename);
                }
            }
            fs.rmdirSync(dir);
        } else {
            console.warn("warn: " + dir + " not exists");
        }
    },
    copyDir(src, dest) {
        this.mkdir(dest);
        var files = fs.readdirSync(src);
        for(var i = 0; i < files.length; i++) {
            var current = fs.lstatSync(path.join(src, files[i]));
            if(current.isDirectory()) {
                this.copyDir(path.join(src, files[i]), path.join(dest, files[i]));
            } else if(current.isSymbolicLink()) {
                var symlink = fs.readlinkSync(path.join(src, files[i]));
                fs.symlinkSync(symlink, path.join(dest, files[i]));
            } else {
                this.copyFile(path.join(src, files[i]), path.join(dest, files[i]));
            }
        }
    },
    copy(src, dest) {
        var current = fs.lstatSync(src);
        if(current.isDirectory()) {
            this.copyDir(src, dest);
        }else{
            this.copyFile(src, dest);
        }
    },
    createDirIfNonexistent(dir) {
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }
}

export default FileUtils;