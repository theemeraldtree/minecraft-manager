import React from "react";
import ReactDOM from 'react-dom';
import App from './app';
import ProfilesManager from "./manager/profilesManager";
import fs from 'fs';
import Global from "./util/global";
import LogManager from "./manager/logManager";
const { remote } = require('electron');
async function load() {
  if(fs.existsSync(Global.PROFILES_PATH)) {
    LogManager.log('info', '[index] Getting profiles...');
    await ProfilesManager.getProfiles();
  }

  document.addEventListener('keydown', (e) => {
    if(e.keyCode == 123) {
      remote.getCurrentWindow().webContents.toggleDevTools();
    }
  });

  ReactDOM.render(
    <App />,
    document.getElementById('app')
  );
}

load();