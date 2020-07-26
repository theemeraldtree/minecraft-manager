import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import path from 'path';
import fs from 'fs';
import { InputHolder, Checkbox, Button } from '@theemeraldtree/emeraldui';
import Overlay from '../../../../component/overlay/overlay';
import AlertBackground from '../../../../component/alert/alertbackground';
import ProfileSelector from '../../../../component/profileSelector/profileSelector';
import ToastManager from '../../../../manager/toastManager';
import logInit from '../../../../util/logger';
import Global from '../../../../util/global';
import FSU from '../../../../util/fsu';
import SettingsManager from '../../../../manager/settingsManager';
import LauncherManager from '../../../../manager/launcherManager';
import LatestProfile from '../../../../defaultProfiles/latestProfile';
import MCLauncherIntegrationHandler from '../../../../minecraft/mcLauncherIntegrationHandler';

const Panel = styled.div`
  background-color: #2b2b2b;
  width: 400px;
  padding: 10px;
  margin-bottom: 5px;

  & > div {
    margin-top: 5px;
  }

  h3 {
    margin: 0;
  }

  button {
    margin-top: 5px;
    display: block;
    width: 285px;
    text-align: left;
  }
`;

const logger = logInit('EditPageAdvancedSync');

export default function Sync(params) {
  const profile = params.profile;
  const [syncOptionsTXT, setSyncOptionsTXT] = useState(profile.mcm.syncOptionsTXT);
  const [syncOptionsOF, setSyncOptionsOF] = useState(profile.mcm.syncOptionsOF);
  const [syncServers, setSyncServers] = useState(profile.mcm.syncServers);
  const [currentCopyObject, setCurrentCopyObject] = useState('');
  const [copyObjectReadable, setCopyObjectReadable] = useState('');
  const [showCopyOverlay, setShowCopyOverlay] = useState(false);

  const [runLatestInIntegrated, setRunLatestInIntegrated] = useState(SettingsManager.currentSettings.runLatestInIntegrated);

  const [runSnapshotInSeperateFolder, setRunSnapshotInSeperateFolder] = useState(
    SettingsManager.currentSettings.runSnapshotInSeperateFolder
  );


  const symlinkFile = (doLink, fileName) => {
    FSU.deleteFileIfExists(path.join(profile.gameDir, fileName));
    if (doLink) {
      FSU.createFileIfMissing(path.join(LatestProfile.gameDir, fileName));
      fs.linkSync(path.join(LatestProfile.gameDir, fileName), path.join(profile.gameDir, fileName));
    }
  };

  const syncOptionsTXTClick = () => {
    const inverted = !syncOptionsTXT;

    logger.info(`{${profile.id}} Setting options.txt sync to ${inverted}`);
    symlinkFile(inverted, 'options.txt');
    profile.mcm.syncOptionsTXT = inverted;
    profile.save();

    setSyncOptionsTXT(inverted);
  };

  const syncOptionsOFClick = () => {
    const inverted = !syncOptionsOF;

    logger.info(`{${profile.id}} Setting optionsof.txt sync to ${inverted}`);

    symlinkFile(inverted, 'optionsof.txt');
    profile.mcm.syncOptionsOF = inverted;
    profile.save();

    setSyncOptionsOF(!syncOptionsOF);
  };

  const syncServersClick = () => {
    const inverted = !syncServers;

    logger.info(`{${profile.id}} Setting servers.dat sync to ${inverted}`);

    symlinkFile(inverted, 'servers.dat');
    profile.mcm.syncServers = inverted;
    profile.save();

    setSyncServers(!syncServers);
  };

  const copyOptionsTXT = () => {
    setCurrentCopyObject('options.txt');
    setCopyObjectReadable('in-game Minecraft Options');
    setShowCopyOverlay(true);
  };

  const copyOptionsOF = () => {
    setCurrentCopyObject('optionsof.txt');
    setCopyObjectReadable('in-game OptiFine Options');
    setShowCopyOverlay(true);
  };

  const copyServers = () => {
    setCurrentCopyObject('servers.dat');
    setCopyObjectReadable('in-game servers list');
    setShowCopyOverlay(true);
  };

  const onCopySelect = prof => {
    const destGameDir = prof.gameDir;
    const destObject = path.join(destGameDir, currentCopyObject);

    logger.info(`{${profile.id}} Copying ${currentCopyObject} to ${prof.id}`);

    FSU.deleteFileIfExists(destObject);
    fs.copyFileSync(path.join(profile.gameDir, currentCopyObject), destObject);

    ToastManager.noticeToast('Copied!');

    setShowCopyOverlay(false);
  };

  const runLatestInIntegratedClick = () => {
    const inverted = !runLatestInIntegrated;
    setRunLatestInIntegrated(inverted);
    MCLauncherIntegrationHandler.integrate();

    SettingsManager.currentSettings.runLatestInIntegrated = inverted;
    SettingsManager.save();

    if (!inverted) {
      profile.gameDir = path.join(profile.profilePath, 'files');
      profile.worlds = [];
      profile.resourcepacks = [];
      profile.save();
      Global.scanProfile(profile);
    } else {
      profile.gameDir = Global.getMCPath();
      profile.worlds = [];
      profile.resourcepacks = [];
      profile.save();
      Global.scanProfile(profile);
    }
  };

  const snapshotSeperateFolderClick = () => {
    const inverted = !SettingsManager.currentSettings.runSnapshotInSeperateFolder;

    logger.info(`Setting runSnapshotInSeperateFolder to ${inverted}`);
    if (inverted) {
      profile.gameDir = path.join(profile.profilePath, 'files');
      profile.worlds = [];
      profile.resourcepacks = [];
      profile.save();
      Global.scanProfile(profile);
    } else {
      profile.gameDir = Global.getMCPath();
      profile.worlds = LatestProfile.worlds;
      profile.resourcepacks = LatestProfile.resourcepacks;
    }
    setRunSnapshotInSeperateFolder(inverted);
    profile.save();
    SettingsManager.currentSettings.runSnapshotInSeperateFolder = inverted;
    SettingsManager.save();

    if (SettingsManager.currentSettings.launcherIntegration) {
      LauncherManager.updateGameDir(profile);
    }
  };


  return (
    <>
      <Overlay in={showCopyOverlay}>
        <AlertBackground>
          <h1>Copy to...</h1>
          <p>
            Where do you want to copy the <b>{copyObjectReadable}</b> to?
          </p>

          <ProfileSelector hideProfile={profile.id} onSelect={onCopySelect} />

          <div className="buttons">
            <Button color="red" onClick={() => setShowCopyOverlay(false)}>
              Cancel
            </Button>
          </div>
        </AlertBackground>
      </Overlay>
      <Panel>
        <h3>Sync Options</h3>

        {(profile.id !== '0-default-profile-latest' && ((profile.id === '0-default-profile-snapshot' && runSnapshotInSeperateFolder) || profile.id !== '0-default-profile-snapshot')) && (
        <>
          <InputHolder>
            <Checkbox lighter checked={syncOptionsTXT} onClick={syncOptionsTXTClick} />
            Sync in-game Minecraft Options with this instance
          </InputHolder>

          <InputHolder>
            <Checkbox lighter checked={syncOptionsOF} onClick={syncOptionsOFClick} />
            Sync in-game OptiFine Options with this instance
          </InputHolder>

          <InputHolder>
            <Checkbox lighter checked={syncServers} onClick={syncServersClick} />
            Sync in-game Server List with this instance
          </InputHolder>
          <br />
        </>
        )}

        {fs.existsSync(path.join(profile.gameDir, 'options.txt')) && (

        <Button color="green" onClick={copyOptionsTXT}>
          Copy in-game Minecraft options to...
        </Button>

        )}
        {fs.existsSync(path.join(profile.gameDir, 'optionsof.txt')) && (
        <Button color="green" onClick={copyOptionsOF}>
          Copy in-game OptiFine options to...
        </Button>
        )}

        {fs.existsSync(path.join(profile.gameDir, 'servers.dat')) && (
        <Button color="green" onClick={copyServers}>
          Copy in-game servers list to...
        </Button>
        )}

        {profile.id === '0-default-profile-latest' && (
        <InputHolder>
          <Checkbox lighter checked={runLatestInIntegrated} onClick={runLatestInIntegratedClick} />
          Run in the Minecraft Home Directory
        </InputHolder>
          )}

        {profile.id === '0-default-profile-snapshot' && (
        <InputHolder>
          <Checkbox lighter checked={runSnapshotInSeperateFolder} onClick={snapshotSeperateFolderClick} />
          Run in a seperate game directory from Latest release
        </InputHolder>
          )}
      </Panel>
    </>
  );
}

Sync.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  profile: PropTypes.object
};
