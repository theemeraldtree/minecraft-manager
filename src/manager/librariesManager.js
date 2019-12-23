import path from 'path';
import Global from '../util/global';
import fs from 'fs';
import DownloadsManager from './downloadsManager';
import rimraf from 'rimraf';
import ProfilesManager from './profilesManager';
import LogManager from './logManager';
const LibrariesManager = {
    getLibrariesPath: function() {
        return path.join(Global.getMCPath(), '/libraries/')
    },
    getMCMLibraries: function() {
        return path.join(this.getLibrariesPath(), '/minecraftmanager/profiles/');
    },
    createForgeLibrary: function(profile) {
        return new Promise((resolve) => {
            if(profile.customVersions.forge.version) {
                const libraryPath = path.join(this.getMCMLibraries(), `/mcm-${profile.id}`);
                if(!fs.existsSync(libraryPath)) {
                    fs.mkdirSync(libraryPath)
                }
                const forgePath = path.join(libraryPath, `/forge`);
                if(!fs.existsSync(forgePath)) {
                    fs.mkdirSync(forgePath);
                }
                let jarPath = path.join(forgePath, `/mcm-${profile.id}-forge.jar`);
                fs.writeFile(jarPath, 'Minecraft Manager - Downloading...', () => {
                    const mcversion = profile.minecraftversion;
                    let downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.customVersions.forge.version}/forge-${profile.customVersions.forge.version}-universal.jar`;
                    if(mcversion === '1.7.10') {
                        downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.customVersions.forge.version}-1.7.10/forge-${profile.customVersions.forge.version}-1.7.10-universal.jar`
                    }else if(mcversion === '1.8.9' || mcversion === '1.8.8' || mcversion === '1.8') {
                        downloadURL = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.customVersions.forge.version}-${mcversion}/forge-${profile.customVersions.forge.version}-${mcversion}-universal.jar`
                    }
                    DownloadsManager.startFileDownload(`Minecraft Forge ${profile.customVersions.forge.version}\n_A_${profile.name}`, downloadURL, jarPath).then(() => {
                        resolve();
                    });
                });
            }
        })
    },
    renameLibrary: function(profile, newID) {
        if(profile.customVersions.forge || profile.customVersions.fabric) {
            // old library method check
            const profileLibrary = path.join(this.getMCMLibraries(), `/mcm-${profile.id}`);
            if(fs.existsSync(path.join(profileLibrary, `/profiles-mcm-${profile.id}.jar`))) {
                fs.renameSync(path.join(profileLibrary, `/profiles-mcm-${profile.id}.jar`), path.join(profileLibrary, `/profiles-mcm-${newID}.jar`));
            }else{             
                if(profile.customVersions.fabric) {
                    fs.renameSync(path.join(profileLibrary, `/fabric-intermediary/mcm-${profile.id}-fabric-intermediary.jar`), path.join(profileLibrary, `/fabric-intermediary/mcm-${newID}-fabric-intermediary.jar`));
                    fs.renameSync(path.join(profileLibrary, `/fabric-loader/mcm-${profile.id}-fabric-loader.jar`), path.join(profileLibrary, `/fabric-loader/mcm-${newID}-fabric-loader.jar`));
                }else if(profile.customVersions.forge) {
                    fs.renameSync(path.join(profileLibrary, `/forge/mcm-${profile.id}-forge.jar`), path.join(profileLibrary, `/forge/mcm-${newID}-forge.jar`));
                }
            }

            fs.renameSync(profileLibrary, path.join(this.getMCMLibraries(), `/mcm-${newID}`));
        }
    },
    deleteLibrary: function(profile) {
        return new Promise((resolve) => {
            let libraryPath = path.join(this.getMCMLibraries(), `/mcm-${profile.id}`);
            if(fs.existsSync(libraryPath)) {
                rimraf(libraryPath, () => {
                    resolve();
                })
            }else{
                resolve();
            }
        })
    },
    cleanLibraries: function() {
        LogManager.log('info', `[LibrariesManager] [CleanLibraries] Starting clean libraries...`);
        fs.readdirSync(this.getMCMLibraries()).forEach(file => {
            if(file.substring(0, 4) === 'mcm-') {
                if(!ProfilesManager.loadedProfiles.find(prof => file === `mcm-${prof.id}`)) {
                    rimraf.sync(path.join(this.getMCMLibraries(), file));
                    LogManager.log('info', `[LibrariesManager] [CleanLibraries] Removed library ${file}`);
                }
            }
        })
    }
}

export default LibrariesManager;