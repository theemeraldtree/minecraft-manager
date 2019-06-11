import Mod from './mod';
import FileUtils from './fileUtils';
import Data from './data';
import CurseManager from '../manager/curseManager';
import MinecraftVersionManager from '../manager/minecraftVersionManager';
import MinecraftLauncherManager from '../manager/minecraftLauncherManager';
import archiver from 'archiver';
const fs = require('fs');
const path = require('path');
const mv = require('mv');
const rimraf = require('rimraf');
export default class Profile {
    constructor(id) {
        this.id = id;
    }
    
    load() {
        return new Promise((resolve) => {
            let profileJsonPath = path.join(FileUtils.getAppPath(), `/profiles/${this.id}/profile.json`);
            if(!fs.existsSync(profileJsonPath)) {
                console.log('doesnt exist');
                let modpackpath = path.join(FileUtils.getAppPath(), `/profiles/${this.id}/modpack.json`);
                if(fs.existsSync(modpackpath)) {
                    console.log('rename');
                    fs.renameSync(modpackpath, profileJsonPath);
                }
            }
            fs.readFile(profileJsonPath, (err, data) => {
                this.loadFile(data, () => {
                    resolve();
                });
            });
        })
    }

    loadFile(file, callback) {
        var packData = JSON.parse(file);
        this.name = packData.packName;
        this.mcVersion = packData.mcVersion;
        this.forgeVersion = packData.forgeVersion;
        this.forgeMCVer = packData.forgeMCVer;
        this.mods = [];
        this.rawForge = packData.rawForge;

        this.curseFileID = packData.curseFileID;
        if(packData.versionname) {
            this.versionname = packData.versionname;
        }else{
            this.versionname = Data.createVersionName(this.name);
        }

        if(packData.isFTB == null) {
            this.isFTB = false;
        }else{
            this.isFTB = packData.isFTB;
        }

        if(packData.epochDate == null) {
            this.epochDate = 0;
        }else{
            this.epochDate = packData.epochDate;
        }
        if(packData.curseID == null) {
            this.curseID = null;
        }else{
            this.curseID = packData.curseID;
        }
        
        if(packData.icon == null) {
            this.icon = path.join(FileUtils.getAppPath(), `/resource/mcm-icon.png`);
        }else{
            this.icon = packData.icon;
        }
        if(packData.packVersion == null) {
            this.version = "1.0.0"
        }else{
            this.version = packData.packVersion;
        }
        if(packData.type == null) {
            this.type = "mcm"
        }else{
            this.type = packData.type;            
        }

        if(packData.mods != null) {
            this.mods = [];
            for(var i = 0; i < packData.mods.length; i++) {
                this.mods.push(new Mod(packData.mods[i]));
            }
        }

        if(packData.description == undefined) {
            this.desc = "No description found."
        }else{
            this.desc = packData.description;
        }

        if(!MinecraftLauncherManager.hasProfile(`mcm-${this.id}`)) {
            MinecraftLauncherManager.addProfile(`mcm-${this.id}`, this.name, path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/`));
        }
        callback();
    }

    checkForUpdates = () => {
        return new Promise((resolve, reject) => {
            if(this.type === 'curse') {
                CurseManager.getModpackLatestFile(this).then((res) => {
                    console.log(this.name);
                    console.log(res.epochDate);
                    console.log(this.epochDate);
                    if(res.epochDate > this.epochDate) {
                        console.log('available');
                        res['updateAvailable'] = true;
                        resolve(res);
                    }else{
                        res['updateAvailable'] = false;
                        resolve(res);
                    }
                    console.log('---------');
                }).catch((err) => {
                    reject(err);
                })
            }else{
                resolve({'updateAvailable': false});
            }

        })
    }

    launch = () => {
        MinecraftLauncherManager.setMostRecentProfile(this);
        MinecraftLauncherManager.openLauncher();
    }

    edit = (history) => {
        history.push(`/profiles/edit/${this.id}/settings`);
    }

    renameFolder = (id) => {
        fs.renameSync(path.join(FileUtils.getAppPath(), `/profiles/${this.id}`), path.join(FileUtils.getAppPath(), `/profiles/${id}`));
    }

    setProfileVersion = (updInfo, statusUpdate) => {
        return new Promise((resolve, reject) => {
            if(this.type !== 'curse') {
                reject('not-curse');
            }else{
                statusUpdate('Removing mods...');
                rimraf(path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/mods`), () => {
                    fs.mkdirSync(path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/mods`));
                    this.mods = [];
                    statusUpdate('Starting installation..');
                    console.log(updInfo);
                    CurseManager.installPackVersion(this, updInfo.fileID, (update) => {
                        statusUpdate(update);
                    }).then(() => {
                        resolve();
                    })
                })

            }
        })
    }

    backup = () => {
        if(!fs.existsSync(path.join(FileUtils.getAppPath(), '/backups'))) {
            fs.mkdirSync(path.join(FileUtils.getAppPath(), '/backups'));
        }
        FileUtils.copyDir(path.join(FileUtils.getAppPath(), `/profiles/${this.id}`), path.join(FileUtils.getAppPath(), `/backups/${this.id}`));
    }
    renameVersions(id, name) {
        let versionname = Data.createVersionName(name);
        var lib = path.join(MinecraftVersionManager.libraryFolder, `/minecraftmanager/profiles/mcm-${this.id}`);
        if(fs.existsSync(lib)) {
            mv(path.join(lib, `/profiles-mcm-${this.id}.jar`), path.join(lib, `/profiles-mcm-${id}.jar`), () => {
                mv(lib, path.join(MinecraftVersionManager.libraryFolder, `/minecraftmanager/profiles/mcm-${id}`), () => {
                    
                });    
            })
        }

        
        
        var ver = path.join(MinecraftVersionManager.versionFolder, `/${this.versionname} (Minecraft Manager)`);

        if(fs.existsSync(ver)) {
            mv(path.join(ver, `/${this.versionname} (Minecraft Manager).json`), path.join(ver, `/${versionname} (Minecraft Manager).json`), () => {  
                var obj = JSON.parse(fs.readFileSync(path.join(ver, `/${versionname} (Minecraft Manager).json`)));
                obj.id = `${versionname} (Minecraft Manager)`; 
                obj.libraries[0].name = `minecraftmanager:profiles:mcm-${id}`
                fs.writeFile(path.join(ver, `/${versionname} (Minecraft Manager).json`), JSON.stringify(obj), () => {
                    mv(ver, path.join(MinecraftVersionManager.versionFolder, `/${versionname} (Minecraft Manager)`), () => {
                        
                    });  
                })
    
            })
        }
 

        
    }

    save = () => {
        var mlist = [];
        if(this.mods != null) {
            for(let mod of this.mods) {
                mlist.push(mod);
            }
        }
        var data = {
            packName: this.name,
            packId: this.id,
            description: this.desc,
            mcVersion: this.mcVersion,
            forgeMCVer: this.forgeMCVer,
            forgeVersion: this.forgeVersion,
            mods: mlist,
            packVersion: this.version,
            type: this.type,
            isFTB: this.isFTB,
            icon: this.icon,
            epochDate: this.epochDate,
            curseID: this.curseID,
            versionname: this.versionname,
            curseFileID: this.curseFileID,
            rawForge: this.rawForge
        }

        fs.writeFileSync(path.join(FileUtils.getAppPath(), `/profiles/${this.id}/profile.json`), JSON.stringify(data));
    }

    exportProfile = (dest, includeFiles, statusUpdate) => {
        return new Promise((resolve) => {
            statusUpdate('Copying folder...');
            let tempPath = path.join(FileUtils.getAppPath(), `/temp/profileexport-${this.id}/`);
            if(fs.existsSync(tempPath)) {
                FileUtils.rmdir(tempPath);
            }
            FileUtils.copyDirSync(path.join(FileUtils.getAppPath(), `/profiles/${this.id}`), tempPath);
            statusUpdate('Removing mods...');
            for(let mod of this.mods) {
                if(mod.type === 'curse') {
                    if(fs.existsSync(path.join(tempPath, `/files/mods/${mod.file}`))) {
                        console.log(`del ${mod.name}`)
                        fs.unlink(path.join(tempPath, `/files/mods/${mod.file}`), () => {})
                    }
                }
            }
            statusUpdate('Removing unused files/folders...');
            fs.readdir(path.join(tempPath, `/files/`), (err, files) => {
                files.forEach((file) => {
                    if(!includeFiles.includes(file)) {
                        if(file !== 'mods') {
                            FileUtils.delete(path.join(tempPath, `/files/${file}`));
                        }
                    }
                });
                statusUpdate('Modifying data...');
                console.log(fs.readFileSync(path.join(tempPath, `/profile.json`)));
                let json = JSON.parse(fs.readFileSync(path.join(FileUtils.getAppPath(), `/profiles/${this.id}/profile.json`)));
                delete json['icon'];
                fs.writeFileSync(path.join(tempPath, `/profile.json`), JSON.stringify(json));
                statusUpdate('Creating package...');
                var archive = archiver("zip");

                console.log(dest);
                archive.pipe(fs.createWriteStream(path.join(dest)));
                
                archive.directory(tempPath, false);

                archive.finalize();
                archive.on('error', (err) => {
                    console.log("oh no " + err);
                });
                archive.on('end', () => {
                    resolve();
                })
            });
        })
    }
    uninstallForge = () => {
        return new Promise((resolve) => {
            console.log('uninstall forge');
            rimraf(path.join(MinecraftVersionManager.libraryFolder, `/minecraftmanager/profiles/mcm-${this.id}`), () => {
                rimraf(path.join(MinecraftVersionManager.versionFolder, `/mcm-${this.id}`), () => {
                    rimraf(path.join(MinecraftVersionManager.versionFolder, `/${this.name} (Minecraft Manager)`), () => {
                        this.forgeMCVer = null;
                        this.forgeVersion = null;
                        this.rawForge = null;
                        MinecraftLauncherManager.setProfileData(`mcm-${this.id}`, 'lastVersionId', this.mcVersion);
                        this.save();
                        resolve();                          
                    })
                });            
            });
        })
    }

    installForgeVersion = (forgeVer, update) => {
        if(!MinecraftLauncherManager.hasProfile(`mcm-${this.id}`)) {
            MinecraftLauncherManager.addProfile(`mcm-${this.id}`, this.name, path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/`));
        }
        return new Promise((resolve) => {
            update('Creating libraries...');
            MinecraftVersionManager.createForgeLibrary(`mcm-${this.id}`, this.mcVersion, forgeVer, path.join(MinecraftVersionManager.libraryFolder, `/minecraftmanager/profiles/mcm-${this.id}`), () => {
                update('Creating versions...');
                MinecraftVersionManager.createVersion(this.mcVersion, `${this.versionname} (Minecraft Manager)`, `mcm-${this.id}`, () => {
                    update('Modifying profile...');
                    MinecraftLauncherManager.setProfileData(`mcm-${this.id}`, 'lastVersionId', `${this.versionname} (Minecraft Manager)`).then(() => {
                        update('Saving data...');
                        console.log(forgeVer);
                        this.forgeMCVer = this.mcVersion;
                        this.forgeVersion = forgeVer;
                        this.save();
                        resolve();
                    });
                })
            })
        })
    }

    changeName = (name) => {
        return new Promise((resolve, reject) => {
            let id = Data.createId(name);
            console.log(`Current id: ${this.id}`);
            MinecraftLauncherManager.setProfileData(`mcm-${this.id}`, 'gameDir', path.join(FileUtils.getAppPath(), `/profiles/${id}/files`)).then(() => {
                MinecraftLauncherManager.setProfileData(`mcm-${this.id}`, 'lastVersionId', `${Data.createVersionName(name)} (Minecraft Manager)`).then(() => {
                    MinecraftLauncherManager.setProfileID(`mcm-${this.id}`, `mcm-${id}`);
                    this.renameVersions(id, name);
                    this.renameFolder(id);
                    this.versionname = Data.createVersionName(name);
                    this.name = name;
                    this.id = id;
                    this.save();
                    resolve(true);
                }).catch((reason) => {
                    reject(reason)
                });
            }).catch((reason) => {
                reject(reason);
            })
        })
    }

    isModInstalled = (mod) => {
        for(let i of this.mods) {
            if(i.id === mod.id) {
                return true;
            }
        }
        return false;
    }
    deleteMod = (mod) => {
        return new Promise((resolve) => {
            for(var i = this.mods.length; i--;){
                if (this.mods[i].id === mod.id) this.mods.splice(i, 1);
            }
    
            this.save();
            fs.unlink(path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/mods/${mod.file}`), () => {
                resolve();
            });
        })

    }
    deleteMods = () => {
        return new Promise((resolve) => {
            this.mods = [];
            this.save();
            rimraf(path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/mods`), () => {
                fs.mkdirSync(path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/mods`));
                resolve();
            })
        })
    }
    delete = () => {
        return new Promise((resolve) => {
            this.uninstallForge().then(() => {
                MinecraftLauncherManager.deleteProfile(`mcm-${this.id}`).then(() => {
                    rimraf(path.join(FileUtils.getAppPath(), `/profiles/${this.id}`), () => {
                        resolve();
                    });
                });
            })
        })
    } 
    changeModVersion = (mod, version, versionName, update) => {
        return new Promise((resolve) => {
            update('Removing old files...');
            fs.unlink(path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/mods/${mod.file}`), () => {
                update('Changing internal version...');
                for(let modi of this.mods) {
                    if(modi.id === mod.id) {
                        modi.curseFileId = version;
                        modi.version = versionName;
                    }
                }
                this.save();
                update('Downloading new files...');
                CurseManager.downloadModFileToLocation(mod, version, path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/mods/${mod.id}.jar`)).then(() => {
                    resolve();
                });
            });
        })

    }
    installMod = (mod, update, opt = {}) => {
        return new Promise((resolve, reject) => {
            CurseManager.getLatestCurseFile(mod, this.mcVersion).then((file) => {
                this.installModVersion(mod, update, file, opt).then(() => {
                    resolve();
                }).catch((err) => {
                    reject(err)
                })
            }).catch((err) => {
                reject(err);
            })
        });
    }
    installModVersion = (mod, update, file, opt = {}) => {
        return new Promise((resolve, reject) => {
            if(this.isModInstalled(mod)) {
                resolve();
                return;
            }
            CurseManager.getDetailedModInfo(mod, true).then((detailedInfo) => {
                console.log(detailedInfo);
                if(detailedInfo.mcVersions.includes(this.mcVersion)) {
                    update('Downloading mod');
                    let newMod = new Mod(JSON.parse(JSON.stringify(mod)));

                    if(!opt['ignore-mod-settings']) {
                        newMod.id = Data.createId(newMod.name);
                        newMod.file = `${newMod.id}.jar`;
                        newMod.curseFileId = file;
                    }
                    if(!opt['ignore-file-details']) {          
                        CurseManager.getFileInfo(mod, file).then((fileInfo) => {
                                console.log(fileInfo);
                                newMod.epochDate = fileInfo['date-epoch'];
                                newMod.version = fileInfo['fileName'];
                                CurseManager.downloadModFileToLocation(mod, file, path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/mods/${newMod.file}`)).then(() => {
                                    this.mods.push(newMod);
                                    this.save();
                                    if(!opt['ignore-dependencies']) {
                                        update('Downloading dependencies');
                                        CurseManager.downloadDependencies(mod, this).then(() => {
                                            console.log('dependencies downloaded for' + mod.name);
                                            resolve();
                                        });
                                    }else{
                                        resolve();
                                    }
                                });
                            })   
                    }else{
                        CurseManager.downloadModFileToLocation(mod, file, path.join(FileUtils.getAppPath(), `/profiles/${this.id}/files/mods/${newMod.file}`)).then(() => {
                            this.mods.push(newMod);
                            this.save();
                            if(!opt['ignore-dependencies']) {
                                update('Downloading dependencies');
                                CurseManager.downloadDependencies(mod, this).then(() => {
                                    console.log('dependencies downloaded for' + mod.name);
                                    resolve();
                                });
                            }else{
                                resolve();
                            }
                        });
                    }
                }else{
                    if(!opt['ignore-invalid-mcversion']) {
                        reject('no-mcversion');
                    }
                }
            }) 
        });
    }
    installMods = (status) => {
        return new Promise((resolve) => {
            status('Installing mod 0/0');
            this.modInstallFinish = 0;
            this.modsToInstall = 0;
            let curseMods = 0;
            for(let mod of this.mods) {
                if(mod.type === 'curse') {
                    curseMods++;
                    console.log(mod);
                    this.modsToInstall++;
                    this.installModVersion(mod, () => {}, mod.curseFileId, {'ignore-mod-settings': true, 'ignore-dependencies': true, 'ignore-file-details': true}).then(() => {
                        this.modInstallFinish++;
                        this.modInstallDone(resolve, status);
                    })
                }
            }
            if(this.mods.length === 0 || curseMods === 0) {
                resolve();
            }
        });
    }
    modInstallDone = (resolve, status) => {
        status(`Installing mod ${this.modInstallFinish}/${this.modsToInstall}`);
        if(this.modInstallFinish === this.modsToInstall) {
            resolve();
        }
    }
    
    installAsset = (asset, update) => {
        return new Promise((resolve, reject) => {
            if(asset instanceof Mod) {
                this.installMod(asset, update).then((res) => {
                    resolve(res);
                }).catch((res) => {
                    reject(res);
                })
            }
        })
    }
}