const { app, BrowserWindow, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const url = require('url');
const path = require('path');
const os = require('os');
const request = require('request');
const yaml = require('js-yaml');
const semver = require('semver');
const { version } = require('./package.json');
// Security warning IS DISABLED because we're loading from localhost.
// this is only disabled so it doesn't clog the console in dev mode
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

let dev = require('process').execPath.includes('electron');
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({width: 800, height: 800, frame: false, backgroundColor: '#444444', webPreferences: {webSecurity: false}, titleBarStyle: 'hidden'});

    if(dev) {
        mainWindow.openDevTools();
    }

    let index;
    if(dev && process.argv.indexOf('--noDevServer') === -1) {
        index = url.format({
          protocol: 'http:',
          host: 'localhost:8080',
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



    // We're on a Mac, which means auto update doesn't work.
    // Here, we manually check for updates and inform the user a new version is available
    if(os.platform() === 'darwin') {
        request.get(`https://theemeraldtree.net/updates/mac/beta-mac.yml`, (err, resp, body) => {
            const doc = yaml.safeLoad(body);
            if(semver.gt(doc.version, version)) {
                dialog.showMessageBox({
                    title: 'Minecraft Manager',
                    message: 'A new version of Minecraft Manager is available. Would you like to go to the website and download it?',
                    buttons: [
                        'No thanks',
                        'Take me there!'
                    ]
                }, buttonIndex => {
                    if(buttonIndex === 1) {
                        shell.openExternal(`https://theemeraldtree.net`);
                    }
                });
            }
        })
        
    }

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
    if(url.substring(0, 22) !== 'http://localhost:8080/' || url.substring(21, 29) === '/linkout') {
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