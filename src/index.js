import React from "react";
import ReactDOM from 'react-dom';
import App from './app';
import ProfilesManager from "./manager/profilesManager";
import fs from 'fs';
import Global from "./util/global";

async function load() {
  if(fs.existsSync(Global.PROFILES_PATH)) {
    await ProfilesManager.getProfiles();
  }
  ReactDOM.render(
    <App />,
    document.getElementById('app')
  );
}

load();