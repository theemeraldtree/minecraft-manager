import React, { useState } from 'react';
import styled from 'styled-components';
import { ipcRenderer } from 'electron';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { Button } from '@theemeraldtree/emeraldui';
import logo from '../../../img/logo-sm.png';
import Section from '../components/section';
import NeedHelp from '../components/needhelp';
import Global from '../../../util/global';
import theemeraldtreelogo from '../img/theemeraldtree-logo.png';
import AlertManager from '../../../manager/alertManager';

const AboutTop = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  padding-top: 30px;
  position: relative;
  h1 {
    color: white;
    margin: 0;
    font-size: 17pt;
  }
  h3 {
    color: #e6e6e6;
    margin: 0;
    font-weight: thin;
    font-size: 13pt;
  }
  background-color: #353535;
`;

const AboutBottom = styled.div`
  color: white;
  a {
    color: #42b3f5;
    text-decoration: none;
  }
`;

const Logo = styled.div`
  width: 80px;
  height: 80px;
  margin-bottom: 65px;
  background-image: url(${logo});
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
`;

const Updates = styled.div`
  margin-top: 10px;
  height: 65px;
  h3 {
    font-size: 12pt;
  }
`;

const BrandLogo = styled.img`
  width: 200px;
  height: 23px;
`;

const SplitSection = styled(Section)`
  display: flex;
  div {
    width: 50%;
  }

  div:nth-child(2) {
    padding-left: 10px;

    li {
      margin-bottom: 5px;
    }
  }
`;

export default function About() {
  const [updateDisabled, setUpdateDisabled] = useState(false);
  const [updateText, setUpdateText] = useState('Check for updates');
  const [updateSubText, setUpdateSubText] = useState('');

  const checkForUpdates = () => {
    if (updateText !== 'restart') {
      setUpdateDisabled(true);
      setUpdateText('Checking for updates...');
      setUpdateSubText('');
      ipcRenderer.send('check-for-updates');

      ipcRenderer.on('update-available', () => {
        setUpdateDisabled(true);
        setUpdateText('Downloading...');
        setUpdateSubText('Update available. Downloading...');
      });

      ipcRenderer.on('update-downloaded', () => {
        setUpdateDisabled(false);
        setUpdateText('Restart');
        setUpdateSubText('Restart to update');
      });

      ipcRenderer.on('error', () => {
        setUpdateDisabled(false);
        setUpdateText('Check for updates');
        setUpdateSubText('Error checking for updates');
      });

      ipcRenderer.on('in-dev', () => {
        setUpdateDisabled(true);
        setUpdateText('In dev mode');
        setUpdateSubText('Cannot update while in dev mode');
      });

      ipcRenderer.on('update-not-available', () => {
        setUpdateDisabled(false);
        setUpdateText('check for updates');
        setUpdateSubText('Update not available');
      });
    } else {
      ipcRenderer.send('install-update');
    }
  };

  return (
    <>
      <Section>
        <AboutTop>
          <Logo />
          <div>
            <a href="https://theemeraldtree.net">
              <BrandLogo src={theemeraldtreelogo} />
            </a>
            <h1>Minecraft Manager</h1>
            <h3>Version {Global.MCM_VERSION}</h3>
            <h3>Released {Global.MCM_RELEASE_DATE}</h3>

            <Updates>
              {os.platform() !== 'darwin' && (
                <Button onClick={checkForUpdates} disabled={updateDisabled} color="green">
                  {updateText}
                </Button>
              )}
              {os.platform() === 'darwin' && (
                <h4>
                  Auto-update isn't supported on macOS
                  <br />
                  <a href="https://github.com/theemeraldtree/minecraft-manager/releases/">
                    Please visit the GitHub Releases page to see if there's an update
                  </a>
                </h4>
              )}
              <h3>{updateSubText}</h3>
            </Updates>
          </div>
        </AboutTop>
        <AboutBottom>
          <h3>
            <a title="Minecraft Manager Source Code" href="https://github.com/theemeraldtree/minecraft-manager">
              Minecraft Manager is open source under GPLv3
            </a>
          </h3>
        </AboutBottom>
      </Section>
      <NeedHelp />
      <SplitSection>
        <div>
          <h2>Credits</h2>
          <h3>Thanks to these open source projects:</h3>
          <ul>
            <li>
              <a href="https://electronjs.org/">Electron</a>
            </li>
            <li>
              <a href="https://reactjs.org/">React</a>
            </li>
            <li>
              <a href="https://www.styled-components.com/">styled-components</a>
            </li>
            <li>
              <a href="https://github.com/gabiseabra/styled-transition-group">styled-transition-group</a>
            </li>
            <li>
              <a href="https://babeljs.io/">Babel</a>
            </li>
            <li>
              <a href="https://webpack.js.org">Webpack</a>
            </li>
            <li>
              <a href="https://eslint.org/">eslint</a>
            </li>
            <li>
              <a href="https://github.com/isaacs/rimraf">rimraf</a>
            </li>
            <li>
              <a href="https://github.com/isaacs/node-mkdirp">mkdirp</a>
            </li>
            <li>
              <a href="https://github.com/axios/axios">axios</a>
            </li>
            <li>
              <a href="https://github.com/cthackers/adm-zip">adm-zip</a>
            </li>
            <li>
              <a href="https://github.com/archiverjs/node-archiver">archiver</a>
            </li>
            <li>
              <a href="https://github.com/PrismarineJS/prismarine-nbt">prismarine-nbt</a>
            </li>
            <li>
              <a href="https://github.com/vkbansal/react-contextmenu">react-contextmenu</a>
            </li>
            <li>
              <a href="https://reacttraining.com/react-router/">react-router & react-router-dom</a>
            </li>
            <li>
              <a href="https://github.com/oliver-moran/jimp">jimp</a>
            </li>
            <li>
              <a href="https://github.com/sindresorhus/p-map">p-map</a>
            </li>
            <li>
              <a href="https://github.com/lodash/lodash">lodash.debounce</a>
            </li>
            <li>
              <a href="https://github.com/paulmillr/chokidar">chokidar</a>
            </li>
            <li>
              <a href="https://fonts.google.com/specimen/Roboto">the Roboto font</a>
            </li>
            <li>other projects</li>
          </ul>

          <Button
            onClick={() =>
              AlertManager.messageBox(
                'Full license information',
                `<textarea class="wrap">${fs.readFileSync(path.join(Global.getResourcesPath(), 'licenseDisclaimer.txt'))}</textarea>`
              )
            }
            color="green"
          >
            View full license info
          </Button>
        </div>
        <div>
          <h2>Special thanks to...</h2>

          <ul>
            <li>
              <a href="https://github.com/robotbrain/ForgeTheSane">robotbrain's ForgeTheSane</a> and
              <a href="https://github.com/Stonebound/ForgeTheSane"> Stonebound's fork</a>. Because of these open source
              projects, we have Forge 1.13+ support!
            </li>
            <li>
              <a href="https://github.com/dries007/CurseMeta">dries007's CurseMeta</a> and
              <a href="https://twitchappapi.docs.apiary.io/"> Gaz492's Twitch App API Docs </a>
              for their CurseForge API Documentation
            </li>
            <li>You! Thank you for using Minecraft Manager!</li>
          </ul>
        </div>
      </SplitSection>
      <Section>
        <h2>Disclaimers</h2>
        <p>
          Minecraft Manager and theemeraldtree are in no way affiliated with, endorsed by, or otherwise related to
          Minecraft Forge, Forge Development LLC, Fabric, CurseForge, Twitch, Overwolf, Mojang, or Microsoft Studios. All
          trademarks belong to their respective owners.
        </p>
      </Section>
    </>
  );
}
