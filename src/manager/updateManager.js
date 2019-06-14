const { ipcRenderer } = require('electron');
const UpdateManager = {
    registerBanner: function(update) {
        this.updateFunc = update;

        ipcRenderer.on('update-available', () => {
            update('update-available');
        });

        ipcRenderer.on('update-downloaded', () => {
            update('update-downloaded');
        });

        ipcRenderer.on('update-error', () => {
            update('update-error');
        })
    }
}

export default UpdateManager;