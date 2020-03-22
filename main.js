const { app, BrowserWindow, shell, ipcMain, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const url = require('url');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const os = require('os');

console.info('Starting Minecraft Manager main Node process');

// Security warning IS DISABLED because we're loading from localhost.
// this is only disabled so it doesn't clog the console in dev mode
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

const downloadProgresses = {};

ipcMain.on('download-file', async (event, downloadURL, dest, id) => {
  downloadProgresses[id] = 0;
  let progressData = 0;
  const ws = fs.createWriteStream(dest);
  console.info(`Downloading ${downloadURL}`);
  const { data, headers } = await axios(downloadURL, {
    responseType: 'stream',
    headers: {
      'X-Client': 'MinecraftManager'
    }
  });

  const contentLength = headers['content-length'];

  data.on('data', chunk => {
    progressData += chunk.length;

    const prog = Math.trunc((progressData / contentLength) * 100);
    if (prog - downloadProgresses[id] >= 10) {
      downloadProgresses[id] = prog;
      if (event) {
        if (event.sender) {
          event.sender.send('file-download-progress', {
            id,
            progress: prog
          });
        }
      }
    }
  });

  data.pipe(ws);

  ws.on('finish', () => {
    console.info(`Download finished ${downloadURL}`);
    event.sender.send('file-download-finish', {
      id
    });
  });
});

const dev = require('process').execPath.includes('electron');

let mainWindow;

ipcMain.on('start-progress', () => {
  if (mainWindow) {
    mainWindow.setProgressBar(2);
  }
});

ipcMain.on('stop-progress', () => {
  if (mainWindow) {
    mainWindow.setProgressBar(0);
  }
});

function navigation(event, navURL) {
  if (
    navURL.substring(0, 22) !== 'http://localhost:9483/' ||
    navURL.substring(21, 29) === '/linkout' ||
    navURL.substring(32, 40) === '/linkout'
  ) {
    let finalUrl = navURL;

    // Handle Curse's "You're leaving CurseForge" feature
    // we redirect straight to the page
    if (navURL.substring(21, 29) === '/linkout') {
      // Curse encodes the URI's twice for some reason
      finalUrl = decodeURIComponent(decodeURI(navURL.substring(40)));
    }

    // linkout for minecraft.curseforge.com
    if (navURL.substring(32, 40) === '/linkout') {
      finalUrl = navURL.substring(51);
    }

    event.preventDefault();
    shell.openExternal(finalUrl);
  }
}

function createWindow() {
  // why show a frame on linux but hide it on everything else?
  // on linux CSD (client-side decoration) causes a ton of problems without a frame
  // so unfortunately it has to be disabled
  console.info('Creating BrowserWindow...');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    frame: os.platform() === 'linux',
    backgroundColor: '#222',
    webPreferences: {
      webSecurity: false,
      experimentalFeatures: true
    },
    titleBarStyle: 'hidden'
  });

  mainWindow.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

  if (dev) {
    // install the react devtools
    // make sure you create a .reactDevtools.json file that looks similar to the following
    // {
    //    "extPath": "PATH TO EXTENSION GOES HERE"
    // }

    if (fs.existsSync('.reactDevtools.json')) {
      const json = JSON.parse(fs.readFileSync('.reactDevtools.json'));
      BrowserWindow.addDevToolsExtension(path.join(json.extPath));
    }

    mainWindow.openDevTools();
  }

  let index;
  if (dev && process.argv.indexOf('--noDevServer') === -1) {
    index = url.format({
      protocol: 'http:',
      host: 'localhost:9483',
      pathname: 'index.html',
      slashes: true
    });
  } else {
    index = url.format({
      protocol: 'file:',
      pathname: path.resolve(__dirname, 'bundles', 'index.html'),
      slashes: true
    });
  }
  mainWindow.loadURL(index);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('will-navigate', (event, navURL) => {
    navigation(event, navURL);
  });

  mainWindow.webContents.on('new-window', (event, navURL) => {
    navigation(event, navURL);
  });

  autoUpdater.checkForUpdatesAndNotify();
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function checkForUpdates() {
  autoUpdater.checkForUpdates();
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('checking-for-update');
  });

  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', () => {
    const notif = new Notification({
      title: 'Minecraft Manager',
      body:
        'An update is available for Minecraft Manager. It has been downloaded and will be installed next time you start the app.'
    });
    notif.show();
    mainWindow.webContents.send('update-downloaded');
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-not-available');
  });

  autoUpdater.on('error', error => {
    if (dev) {
      mainWindow.webContents.send('in-dev');
    } else {
      mainWindow.webContents.send('error', error);
    }
  });
}

ipcMain.on('check-for-updates', () => {
  checkForUpdates();
});

if (!dev) {
  checkForUpdates();
}

app.on('ready', createWindow);
