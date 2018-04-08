import FileUtils from '../util/fileUtils';
const fs = require('fs');
const {ipcRenderer} = require('electron');
const UpdateManager = {
    checkForUpdates() {
        if(fs.existsSync(FileUtils.getAppPath())) {
            ipcRenderer.on('checking-for-update', () => {
                console.log('checking');
                this.updateText = 'Checking for Updates..'
            });
    
            ipcRenderer.on('update-available', () => {
                console.log('update available');
                this.updateText = 'Downloading update...'
            })
    
            ipcRenderer.on('update-downloaded', () => {
                console.log('update downloaded');
                this.updateText = 'Update downloaded'
            })
    
            ipcRenderer.on('update-not-available', () => {
                console.log('update not available')
                this.updateText = 'Update not available'
                setTimeout(() => {
                    this.updateText = ''                   
                }, 1500)
            })
    
            ipcRenderer.on('error', () => {
                console.log('update error')
                this.updateText = 'Error checking for updates';
                setTimeout(() => {
                    this.updateText = ''
                }, 4000);
            });
        }else{
            this.updateText = ''
        }
    }
};

export default UpdateManager;