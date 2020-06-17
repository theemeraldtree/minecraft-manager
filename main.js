const { app, BrowserWindow, shell, ipcMain, Notification, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const url = require('url');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const os = require('os');
const winston = require('winston');
const { execFile } = require('child_process');
require('winston-daily-rotate-file');
require('v8-compile-cache');

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) app.quit();

const logformat = winston.format.printf(
  ({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`
);

const rotateFile = new winston.transports.DailyRotateFile({
  filename: '%DATE%-main.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '7d',
  createSymlink: true,
  symlinkName: 'latest-main.log',
  auditFile: path.join(app.getPath('userData'), '/logs/main-node-process/.mcm-main-log-audit.json'),
  dirname: path.join(app.getPath('userData'), '/logs/main-node-process')
});

const mainLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.align(), logformat),
  transports: [rotateFile, new winston.transports.Console({ colorize: true, prettyPrint: true, level: 'info' })]
});

mainLogger.info('Launching Minecraft Manager');
mainLogger.info('Starting Main Node Process');

// Security warning IS DISABLED because we're loading from localhost.
// this is only disabled so it doesn't clog the console in dev mode
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

const downloadProgresses = {};

ipcMain.on('download-file', async (event, downloadURL, dest, id) => {
  mainLogger.info('Received Download File IPC');
  downloadProgresses[id] = 0;
  let progressData = 0;
  const ws = fs.createWriteStream(dest);
  mainLogger.info(`Starting download of ${downloadURL}`);
  try {
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
      mainLogger.info(`Finished download of ${downloadURL}`);
      event.sender.send('file-download-finish', {
        id
      });
    });
  } catch (e) {
    mainLogger.error(e);
    event.sender.send('file-download-error', { id, error: e });

    ws.close();

    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
  }
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

    mainLogger.info(`Navigating externally to ${finalUrl}`);

    event.preventDefault();
    shell.openExternal(finalUrl);
  }
}

function createWindow() {
  // why show a frame on linux but hide it on everything else?
  // on linux CSD (client-side decoration) causes a ton of problems without a frame
  // so unfortunately it has to be disabled
  mainLogger.info('Creating Electron BrowserWindow');
  mainLogger.info('OPEN BROWSERWINDOW!!!!!!!!!!!!!!!!!!!!!!');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    frame: os.platform() === 'linux',
    backgroundColor: '#222',
    webPreferences: {
      webSecurity: false,
      experimentalFeatures: true,
      nodeIntegration: true
    },
    titleBarStyle: 'hidden'
  });

  mainWindow.removeMenu();

  if (os.platform() === 'win32') {
    if (fs.existsSync(path.join('C:\\Program Files\\Minecraft Manager\\Uninstall Minecraft Manager.exe'))) {
      // 2.4.2 changed the program from being a per-machine install to a per-user install
      // Unfortunately electron-updater doesn't cleanup the old version,
      // so we have to check and remove it manually
      const ret = dialog.showMessageBox({
        type: 'info',
        title: 'Heads Up!',
        message:
          'Minecraft Manager version 2.4.2 requires the uninstaller of the previous version to be ran on first launch.\n\nYou may have to agree to some User Account Control dialogs.\n\nIf you get an error, report it at https://theemeraldtree.net/mcm/issues',
        buttons: ['View More Info and Continue', 'Continue'],
        noLink: true,
        defaultId: 1,
        cancelId: 1
      });

      if (ret === 0) {
        shell.openExternal('https://github.com/theemeraldtree/minecraft-manager/wiki/2.4.2-Uninstaller-Information');
      }

      execFile('C:\\Program Files\\Minecraft Manager\\Uninstall Minecraft Manager.exe', ['/S']);
    }
  }

  mainWindow.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

  if (dev) {
    // install the react devtools
    // make sure you create a .reactDevtools.json file that looks similar to the following
    // {
    //    "extPath": "C:\\Users\\username\\AppData\\Local\\Google\\Chrome\\User Data\\\Default\\Extensions\\extensionidgoeshere\\versionnumber"
    // }

    if (fs.existsSync('.reactDevtools.json')) {
      mainLogger.info('Attempting to add React DevTools to BrowserWindow');
      const json = JSON.parse(fs.readFileSync('.reactDevtools.json'));
      BrowserWindow.addDevToolsExtension(path.join(json.extPath));
    }

    mainLogger.info('Opening DevTools in BrowserWindow');
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
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    mainLogger.info('Quitting Minecraft Manager...');
    app.quit();
  }
});

let currentUpdateState = 'checking-for-update';

function checkForUpdates() {
  // if (dev) {
  //   mainLogger.info('[Updater] Cannot update while in dev mode');
  //   mainWindow.webContents.send('in-dev');
  // } else {
  currentUpdateState = 'checking-for-update';
  mainLogger.info('[Updater] Checking for updates...');
  autoUpdater.checkForUpdates();
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('checking-for-update');
  });

  autoUpdater.on('update-available', () => {
    currentUpdateState = 'update-available';
    mainLogger.info('[Updater] Found an update. Sending IPC...');
    mainWindow.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', () => {
    currentUpdateState = 'update-downloaded';
    mainLogger.info('[Updater] Successfully downloaded update. Sending Notification and IPC...');
    const notif = new Notification({
      title: 'Minecraft Manager',
      body:
        'An update is available for Minecraft Manager. It has been downloaded and will be installed next time you start the app.'
    });
    notif.show();
    mainWindow.webContents.send('update-downloaded');
  });

  autoUpdater.on('update-not-available', () => {
    currentUpdateState = 'update-not-available';
    mainLogger.info('[Updater] No updates available');
    mainWindow.webContents.send('update-not-available');
  });

  autoUpdater.on('error', error => {
    currentUpdateState = 'error';
    mainLogger.error(`[Updater] Error checking for updates:\n${error.toString()}`);
    mainWindow.webContents.send('error', error);
  });
  // }
}

ipcMain.on('check-for-updates', () => {
  if (currentUpdateState !== 'error' && currentUpdateState !== 'update-not-available') {
    mainWindow.webContents.send(currentUpdateState);
  } else {
    checkForUpdates();
  }
});

checkForUpdates();

app.on('ready', createWindow);
