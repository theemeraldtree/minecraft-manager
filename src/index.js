/* eslint-disable no-console */
import React from 'react';
import ReactDOM from 'react-dom';
import fs from 'fs';
import path from 'path';
import App from './app';
import ProfilesManager from './manager/profilesManager';
import Global from './util/global';
import SettingsManager from './manager/settingsManager';
import HTTPRequest from './host/httprequest';
import ToastManager from './manager/toastManager';
import ErrorManager from './manager/errorManager';
import LibrariesManager from './manager/librariesManager';
import './font/fonts.css';
import { loadLatestProfile } from './defaulltProfiles/latestProfile';
import { loadSnapshotProfile } from './defaulltProfiles/snapshotProfile';

const { remote, shell, ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const request = require('request');
const yaml = require('js-yaml');
const semver = require('semver');
const os = require('os');
const { version } = require('../package.json');

async function load() {
  await SettingsManager.loadSettings();

  try {
    Global.updateMCVersions();
    if (fs.existsSync(Global.PROFILES_PATH)) {
      // LogManager.log('info', '[index] Getting profiles...');

      // Check for directories - we need to make sure everything exists
      if (!fs.existsSync(path.join(Global.getMCPath(), '/libraries/minecraftmanager'))) {
        fs.mkdirSync(path.join(Global.getMCPath(), '/libraries/minecraftmanager'));
      }

      if (!fs.existsSync(Global.getMCPath(), '/libraries/minecraftmanager/profiles')) {
        fs.mkdirSync(path.join(Global.getMCPath(), '/libraries/minecraftmanager/profiles'));
      }
    }
  } catch (e) {
    ToastManager.createToast('ERROR', ErrorManager.makeReadable(e));
    console.error(e);
  }

  loadLatestProfile();
  loadSnapshotProfile();

  await ProfilesManager.getProfiles();

  document.addEventListener('keydown', e => {
    if (e.keyCode === 123) {
      remote.getCurrentWindow().webContents.toggleDevTools();
    }
  });

  ipcRenderer.on('file-download-progress', (event, progress) => {
    HTTPRequest.fileDownloadProgress(progress);
  });

  ipcRenderer.on('file-download-finish', (event, progress) => {
    HTTPRequest.fileDownloadFinish(progress);
  });

  try {
    if (fs.existsSync(Global.PROFILES_PATH)) {
      LibrariesManager.checkExist();
      Global.checkMinecraftVersions();
      Global.checkMinecraftProfiles();
      Global.checkMinecraftLibraries();
      Global.checkToastNews();
      Global.checkChangelog();
      // We call this function in order to see if any changes to OMAF or any other method have been made since the last version
      Global.checkMigration();

      Global.scanProfiles();

      ProfilesManager.updateReloadListeners();
    }
  } catch (e) {
    ToastManager.createToast('ERROR', ErrorManager.makeReadable(e));
    console.error(e);
  }

  // We're on a Mac, which means auto update doesn't work.
  // Here, we manually check for updates and inform the user a new version is available
  if (os.platform() === 'darwin') {
    request.get('https://theemeraldtree.net/updates/mac/mac.yml', (err, resp, body) => {
      const doc = yaml.safeLoad(body);
      if (semver.gt(doc.version, version)) {
        dialog.showMessageBox(
          {
            title: 'Minecraft Manager',
            message:
              'A new version of Minecraft Manager is available. Would you like to go to the website and download it?',
            buttons: ['No thanks', 'Take me there!']
          },
          buttonIndex => {
            if (buttonIndex === 1) {
              shell.openExternal('https://theemeraldtree.net/mcm/download');
            }
          }
        );
      }
    });
  }

  // eslint-disable-next-line react/jsx-filename-extension
  ReactDOM.render(<App />, document.getElementById('app'));
}

load();
