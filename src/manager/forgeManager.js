import VersionsManager from "./versionsManager";
import LibrariesManager from "./librariesManager";
import HTTPRequest from "../host/httprequest";

const ForgeManager = {
    setupForge: (profile) => {
        return new Promise((resolve) => {
            VersionsManager.createVersion(profile);
            LibrariesManager.createForgeLibrary(profile).then(() => {
                profile.setForgeInstalled(true);
                resolve();
            });
        });
    },
    uninstallForge: (profile) => {
        return new Promise((resolve) => {
            LibrariesManager.deleteLibrary(profile).then(() => {
                VersionsManager.deleteVersion(profile).then(() => {
                    profile.removeForge();
                    resolve();
                })
            })
        })
    },
    getForgePromotions: () => {
        return new Promise((resolve) => {
            HTTPRequest.httpGet('https://files.minecraftforge.net/maven/net/minecraftforge/forge/promotions.json').then((promotions) => {
                resolve(promotions);
            });
        });
    }
}

export default ForgeManager;