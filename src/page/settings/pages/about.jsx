import React, { useState } from 'react';
import styled from 'styled-components';
import { ipcRenderer } from 'electron';
import os from 'os';
import logo from '../../../img/logo-sm.png';
import Button from '../../../component/button/button';
import Section from '../components/section';
import NeedHelp from '../components/needhelp';
import Global from '../../../util/global';
import theemeraldtreelogo from '../img/theemeraldtree-logo.png';
import AlertManager from '../../../manager/alertManager';
import licenseDisclaimer from '../../../assets/licenseDisclaimer.txt';

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
  background-color: #505050;
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
`;

export default function About() {
  const [updateDisabled, setUpdateDisabled] = useState(false);
  const [updateText, setUpdateText] = useState('check for updates');
  const [updateSubText, setUpdateSubText] = useState('');

  const checkForUpdates = () => {
    if (updateText !== 'restart') {
      setUpdateDisabled(true);
      setUpdateText('checking for updates...');
      setUpdateSubText('');
      ipcRenderer.send('check-for-updates');

      ipcRenderer.on('update-available', () => {
        setUpdateDisabled(true);
        setUpdateText('downloading');
        setUpdateSubText('Update available. Downloading...');
      });

      ipcRenderer.on('update-downloaded', () => {
        setUpdateDisabled(false);
        setUpdateText('restart');
        setUpdateSubText('Restart to update');
      });

      ipcRenderer.on('error', () => {
        setUpdateDisabled(false);
        setUpdateText('check for updates');
        setUpdateSubText('Error checking for updates');
      });

      ipcRenderer.on('in-dev', () => {
        setUpdateDisabled(true);
        setUpdateText('in dev');
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
            <h1>About Minecraft Manager</h1>
            <h3>Version {Global.MCM_VERSION}</h3>
            <h3>released {Global.MCM_RELEASE_DATE}</h3>

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
      <Section>
        <h2>Credits</h2>
        <h3>
          Minecraft Manager is made possible thanks to:
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
            <a href="https://github.com/apostrophecms/sanitize-html">sanitize-html</a>
          </li>
          <li>
            <a href="https://fonts.google.com/specimen/Roboto">the Roboto font</a>
          </li>
          <li>other projects</li>
          and of course, YOU! Thank you for using Minecraft Manager, I really hope you enjoy it.
        </h3>
        <h3>
          Huge credit to <a href="https://github.com/robotbrain/ForgeTheSane">robotbrain's ForgeTheSane</a> and
          <a href="https://github.com/Stonebound/ForgeTheSane">Stonebound's fork</a>. Because of these open source
          projects, we have Forge 1.13+ support!
        </h3>
        <h3>
          CurseForge API Information thanks to <a href="https://github.com/dries007/CurseMeta">dries007's CurseMeta</a>{' '}
          and <a href="https://twitchappapi.docs.apiary.io/">Gaz492's TwitchAppAPI Docs</a>
        </h3>

        <Button
          onClick={() =>
            AlertManager.messageBox(
              'full license information',
              `<textarea class="wrap">${licenseDisclaimer}</textarea>`
            )
          }
          color="green"
        >
          view full license information
        </Button>
      </Section>
      <Section>
        <h2>Other things to check out</h2>
        <h3>
          <li>
            <a href="https://stopmodreposts.org">stopmodreposts.org</a>
          </li>
          <li>
            <a href="https://fabricmc.net">fabricmc.net</a>
          </li>
          <li>
            <a href="https://minecraftforge.net">minecraftforge.net</a>
          </li>
          <li>
            <a href="https://www.reddit.com/r/feedthebeast/">r/feedthebeast</a>
          </li>
          <li>
            <a href="https://www.reddit.com/r/minecraft/">r/minecraft</a>
          </li>
        </h3>
      </Section>
      <Section>
        <h2>Disclaimers</h2>
        <h3>
          Minecraft Manager and theemeraldtree are in no way affiliated with, endorsed by, or otherwise related to
          Minecraft Forge, Forge Development LLC, Fabric, CurseForge, Twitch, Amazon, Mojang, or Microsoft Studios. All
          trademarks belong to their respective owners.
        </h3>
      </Section>
    </>
  );
}
