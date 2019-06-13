const remote = require('electron').remote;
const app = remote.app;
const path = require('path');
const os = require('os');
const Global = {
    MCM_PATH: app.getPath('userData'),
    PROFILES_PATH: path.join(app.getPath('userData') + '/profiles/'),
    MC_PATH: path.join(app.getPath('appData'), '.minecraft'),
    MC_VERSIONS: ['1.14.2', '1.14.1', '1.14', '1.13.2', '1.13.1', '1.13', '1.12.2', '1.12.1', '1.12', '1.11.2', '1.11.1', '1.11', '1.10.2', '1.10.1', '1.10', '1.9.4', '1.9.3', '1.9.2', '1.9.1', '1.9.0', '1.8.9', '1.8.8', '1.8.7', '1.8.6', '1.8.5', '1.8.4', '1.8.3', '1.8.2', '1.8.1', '1.8', '1.7.10', '1.7.9', '1.7.8', '1.7.7', '1.7.6', '1.7.5', '1.7.4', '1.7.3', '1.7.2', '1.6.4', '1.6.2', '1.6.1', '1.5.2', '1.5.1', '1.4.7', '1.4.6', '1.4.5', '1.4.4', '1.4.2', '1.3.2', '1.3.1', '1.2.5', '1.2.4', '1.2.3', '1.2.2', '1.2.1', '1.1', '1.0'],
    getLauncherPath: () => {
        if(os.platform() === 'win32') {
            return path.join('C:\\Program Files (x86)\\Minecraft\\MinecraftLauncher.exe');
        }else if(os.platform() === 'darwin') {
            return path.join('/Applications/Minecraft.app');
        }
    },
    createID: (name) => {
        let newname = name;
        newname = name.replace(/\s+/g, '-').toLowerCase();
        newname = newname.replace('/', '');
        return newname;
    },
    getResourcesPath: () => {
        let dev = false;
        if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
            dev = true;
        }
        if(dev) {
            return path.join('resources');
        }else{
            if(os.platform() === 'win32' || os.platform() === 'darwin') {
                return path.join(remote.app.getAppPath(), `../resources`);
            }else{
                return null;
            }
        }
    }
}

export default Global;