const remote = require('electron').remote;
const app = remote.app;
const path = require('path');
const os = require('os');
const Global = {
    MCM_PATH: app.getPath('userData'),
    PROFILES_PATH: path.join(app.getPath('userData') + '/profiles/'),
    MC_PATH: path.join(app.getPath('appData'), '.minecraft'),
    getLauncherPath: () => {
        if(os.platform() === 'win32') {
            return path.join('C:\\Program Files (x86)\\Minecraft\\MinecraftLauncher.exe');
        }else if(os.platform() === 'darwin') {
            return path.join('/Applications/Minecraft.app');
        }
    }
}

export default Global;