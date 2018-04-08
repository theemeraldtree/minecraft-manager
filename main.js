'use strict';

// Import parts of electron to use
const {app, BrowserWindow} = require('electron');
const path = require('path')
const Notification = require("electron").Notification;
const {autoUpdater} = require("electron-updater");
const url = require('url')
const {ipcMain} = require('electron');
const {dialog} = require('electron')
const os = require('os');
const process = require('process');
const {shell} = require('electron');
const util = require('util');
const fs = require('fs');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let updateChecker;
// Keep a reference for dev mode
let dev = false;
if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
  dev = true;
}
function msg(text) {
  dialog.showMessageBox({message: text});
}
ipcMain.on("closeUpdateWindow", (ev, arg) => {
  closeUpdateWindow();
})
ipcMain.on("createUpdateCheckerWindow", (event, arg) => {
  createUpdateCheckerWindow();
});
function closeUpdateWindow() {
  updateChecker.close();
  updateChecker = null;
}
ipcMain.on("openFolder", (event, folder) => {
  shell.openItem(folder);
})
process.on('uncaughtException', function (err) {
  console.log(err);
});


ipcMain.on('installUpdate', () => {
  autoUpdater.quitAndInstall();
})
function startUpdateChecker() {
  autoUpdater.checkForUpdates();
  autoUpdater.on("checking-for-update", () => {
    mainWindow.webContents.send("checking-for-update");
  })
  autoUpdater.on("update-available", () => {
    mainWindow.webContents.send("update-available");
  })
  autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("update-downloaded");
  })
  autoUpdater.on("update-not-available", () => {
    mainWindow.webContents.send("update-not-available");
  })
  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send("error", err);
  })
}
startUpdateChecker();
function createWindow() {
  //if(!dev) {

    
    //createUpdateCheckerWindow();
  //}
  

  // Create the browser window.
  app.commandLine.appendSwitch('disable-web-security');
  
  let windowOptions = {width: 1024, height: 768, show: false, minWidth: 1024, minHeight: 768, webPreferences: {webSecurity: false}, backgroundColor: '#252525'};
  if(os.platform() === 'darwin') {
    windowOptions['titleBarStyle'] = 'hidden';
  }else{
    windowOptions['frame'] = false;
  }
  mainWindow = new BrowserWindow(windowOptions);


  let indexPath;
  if ( dev && process.argv.indexOf('--noDevServer') === -1 ) {
    indexPath = url.format({
      protocol: 'http:',
      host: 'localhost:8080',
      pathname: 'index.html',
      slashes: true
    });
  } else {
    indexPath = url.format({
      protocol: 'file:',
      pathname: path.resolve(__dirname, 'bundles', 'index.html'),
      slashes: true
    });
  }
  mainWindow.loadURL( indexPath );

  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if(dev || fs.existsSync(path.join(app.getPath('appData'), '/Minecraft Manager/.force_devtools'))) {
      mainWindow.webContents.openDevTools();
    }
    
      
    
    
  });
  

  
  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  if(!dev) {
   mainWindow.webContents.on('will-navigate', ev => {
     ev.preventDefault()
   })
  }

  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    let newUrl = url.substring(40);
    console.log(url.substring(0, 8));
    console.log(url.substring(7, 16));
    if((url.substring(0, 8) === 'https://' || url.substring(0, 7) === 'http://') && url.substring(7, 16) !== 'localhost') {
      newUrl = url;
    }else{
      newUrl = decodeURIComponent(decodeURIComponent(newUrl));
    }
    require('electron').shell.openExternal(newUrl);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});



// IPC calls
ipcMain.on("openFolder", (event, folder) => {
  shell.openItem(folder);
})