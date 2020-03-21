/* eslint-disable no-console */
import 'react-hot-loader/patch';
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
import { loadLatestProfile } from './defaultProfiles/latestProfile';
import { loadSnapshotProfile } from './defaultProfiles/snapshotProfile';

const { remote, ipcRenderer } = require('electron');

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

  if (fs.existsSync(Global.PROFILES_PATH)) {
    loadLatestProfile();
    loadSnapshotProfile();
  }

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

  // eslint-disable-next-line react/jsx-filename-extension
  ReactDOM.render(<App />, document.getElementById('app'));
}

if (module.hot) {
  module.hot.accept();
}

load();
