import path from 'path';
import Global from '../util/global';
import fs from 'fs';
import DownloadsManager from './downloadsManager';
import rimraf from 'rimraf';
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
                let jarPath = path.join(this.getMCMLibraries(), `/mcm-${profile.id}/profiles-mcm-${profile.id}.jar`);
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
        if(profile.customVersions.forge) {
            fs.renameSync(path.join(this.getMCMLibraries(), `/mcm-${profile.id}/profiles-mcm-${profile.id}.jar`), path.join(this.getMCMLibraries(), `/mcm-${profile.id}/profiles-mcm-${newID}.jar`));
            fs.renameSync(path.join(this.getMCMLibraries(), `/mcm-${profile.id}`), path.join(this.getMCMLibraries(), `/mcm-${newID}`));
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
    }
}

export default LibrariesManager;