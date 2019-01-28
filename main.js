const { app, BrowserWindow, shell } = require('electron');
const url = require('url');
const path = require('path');
// Security warning IS DISABLED because we're loading from localhost.
// this is only disabled so it doesn't clog the console in dev mode
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

let dev = require('process').execPath.includes('electron');
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({width: 600, height: 800, frame: false, webPreferences: {webSecurity: false}});

    mainWindow.openDevTools();
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

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        navigation(event, url)
    })

    mainWindow.webContents.on('new-window', (event, url) => {
        navigation(event, url);
    })
}

function navigation(event, url) {
    if(url.substring(0, 22) !== 'http://localhost:8080/') {
        event.preventDefault();
        shell.openExternal(url);
    }
}


app.on('ready', createWindow);