import path from 'path';
import Global from '../util/global';
import fs from 'fs';
import DownloadsManager from './downloadsManager';
import rimraf from 'rimraf';
const LibrariesManager = {
    LIBRARIES_PATH: path.join(Global.MC_PATH, '/libraries/'),
    MCM_LIBRARIES: path.join(Global.MC_PATH, '/libraries/minecraftmanager/profiles/'),
    createForgeLibrary: function(profile) {
        return new Promise((resolve) => {
            if(profile.forgeVersion) {
                fs.mkdir(path.join(this.MCM_LIBRARIES, `/mcm-${profile.id}`), () => {
                    let jarPath = path.join(this.MCM_LIBRARIES, `/mcm-${profile.id}/profiles-mcm-${profile.id}.jar`);
                    fs.writeFile(jarPath, 'Minecraft Manager - Downloading...', () => {
                        DownloadsManager.startFileDownload(`Minecraft Forge ${profile.forgeVersion} for ${profile.name}`, `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${profile.forgeVersion}/forge-${profile.forgeVersion}-universal.jar`, jarPath).then(() => {
                            resolve();
                        });
                    });
                });
            }
        })
    },
    deleteLibrary: function(profile) {
        return new Promise((resolve) => {
            let libraryPath = path.join(this.MCM_LIBRARIES, `/mcm-${profile.id}`);
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