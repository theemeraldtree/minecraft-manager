import HTTPRequest from "../host/httprequest";
import VersionsManager from "./versionsManager";
import DownloadsManager from "./downloadsManager";
import LibrariesManager from "./librariesManager";
import path from 'path';
import fs from 'fs';

const FabricManager = {
    setupFabric: (profile) => {
        return new Promise(async (resolve) => {

            const versionMeta = JSON.parse(await HTTPRequest.get(`https://meta.fabricmc.net/v2/versions/loader/${profile.minecraftversion}/${profile.customVersions.fabric.version}`));
            VersionsManager.createVersionFabric(profile, versionMeta);

            const libraryPath = path.join(LibrariesManager.getMCMLibraries(), `/mcm-${profile.id}`);
            if(!fs.existsSync(libraryPath)) {
                fs.mkdirSync(libraryPath);
            }

            fs.mkdirSync(path.join(libraryPath, '/fabric-intermediary'));
            fs.mkdirSync(path.join(libraryPath, '/fabric-loader'));



            DownloadsManager.startFileDownload(
                `Fabric Intermediary\n_A_${profile.name}`, 
                `https://maven.fabricmc.net/net/fabricmc/intermediary/${profile.minecraftversion}/intermediary-${profile.minecraftversion}.jar`, 
                path.join(libraryPath, `fabric-intermediary/mcm-${profile.id}-fabric-intermediary.jar`
            ));

            DownloadsManager.startFileDownload(
                `Fabric Loader\n_A_${profile.name}`, 
                `https://maven.fabricmc.net/net/fabricmc/fabric-loader/${profile.customVersions.fabric.version}/fabric-loader-${profile.customVersions.fabric.version}.jar`, 
                path.join(libraryPath, `fabric-loader/mcm-${profile.id}-fabric-loader.jar`
            ));

            
            resolve();
        })
    },
    getFabricLoaderVersions: (mcversion) =>     {
        return new Promise(resolve => {
            HTTPRequest.httpGet(`https://meta.fabricmc.net/v2/versions/loader/${mcversion}`).then(versions => {
                resolve(JSON.parse(versions));
            });
        })
    }
};

export default FabricManager;