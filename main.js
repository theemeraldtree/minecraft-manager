const { app, BrowserWindow, shell, ipcMain, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const url = require('url');
const path = require('path');
const fs = require('fs');
const request = require('request-promise');
// Security warning IS DISABLED because we're loading from localhost.
// this is only disabled so it doesn't clog the console in dev mode
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
});

const downloadProgresses = {};


ipcMain.on('download-file', (event, url, dest, id) => {
    downloadProgresses[id] = 0;
    let progressData = 0;
    let contentLength = 0;
    let ws = fs.createWriteStream(dest);
    let req = request(url, {
        url: url,
        headers: {
            'User-Agent': 'Minecraft-Manager'
        },
        followAllRedirects: true
    });
    req.on('data', (data) => {
        progressData += data.length;
        
        let prog = Math.trunc((progressData / contentLength) * 100);
        if(prog - downloadProgresses[id] >= 10) {
            downloadProgresses[id] = prog;
            event.sender.send('file-download-progress', {
                id: id,
                progress: prog ,
            });
        }
    })
    req.on('response', (res) => {
        contentLength = res.headers['content-length'];
        res.pipe(ws);
        ws.on('finish', () => event.sender.send('file-download-finish', {
            id: id
        }));
    })
    req.on('error', () => {
        ws.end();
    });
})


function checkForUpdates() {
    autoUpdater.checkForUpdates();
    autoUpdater.on('checking-for-update', () => {
        mainWindow.webContents.send('checking-for-update');
    });

    autoUpdater.on('update-available', () => {
        mainWindow.webContents.send('update-available');
    });

    autoUpdater.on('update-downloaded', () => {
        const notif = new Notification({title: 'Minecraft Manager', body: 'An update is available for Minecraft Manager. It has been downloaded and will be installed next time you start the app.'});
        notif.show();
        mainWindow.webContents.send('update-downloaded');
    })

    autoUpdater.on('update-not-available', () => {
        mainWindow.webContents.send('update-not-available');
    })

    autoUpdater.on('error', (error) => {
        mainWindow.webContents.send('error', error);
    })
}

ipcMain.on('check-for-updates', function() {
    checkForUpdates();
})

checkForUpdates();

let dev = require('process').execPath.includes('electron');
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({width: 800, height: 800, frame: false, backgroundColor: '#444444', webPreferences: {webSecurity: false}, titleBarStyle: 'hidden'});

    if(dev) {

        // install the react devtools
        // make sure you create a .reactDevtools.json file that looks similar to the following
        // {
        //    "extPath": "PATH TO EXTENSION GOES HERE"
        // }

        if(fs.existsSync('.reactDevtools.json')) {
            const json = JSON.parse(fs.readFileSync('.reactDevtools.json'));
            BrowserWindow.addDevToolsExtension(path.join(json.extPath));    
        }

        mainWindow.openDevTools();
    }

    let index;
    if(dev && process.argv.indexOf('--noDevServer') === -1) {
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

    mainWindow.webContents.on('will-navigate', (event, url) => {
        navigation(event, url)
    })

    mainWindow.webContents.on('new-window', (event, url) => {
        navigation(event, url);
    });

    autoUpdater.checkForUpdatesAndNotify();
}


function navigation(event, url) {
    if(url.substring(0, 22) !== 'http://localhost:9483/' || url.substring(21, 29) === '/linkout') {
        let finalUrl = url;


        // Handle Curse's "You're leaving CurseForge" feature
        // we redirect straight to the page
        if(url.substring(21, 29) === '/linkout') {

            // Curse encodes the URI's twice for some reason
            finalUrl = decodeURIComponent(decodeURI(url.substring(40)));
        }

        event.preventDefault();
        shell.openExternal(finalUrl);
    }
}

app.on('window-all-closed', function() {
    if(process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('ready', createWindow);