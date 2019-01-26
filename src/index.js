import React from "react";
import ReactDOM from 'react-dom';
import App from './app';
import ProfilesManager from "./manager/profilesManager";

async function load() {
await ProfilesManager.getProfiles();
ReactDOM.render(
  <App />,
  document.getElementById('app')
);
}

load();