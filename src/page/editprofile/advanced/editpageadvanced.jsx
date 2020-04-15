import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import path from 'path';
import { shell } from 'electron';
import fs from 'fs';
import ProfilesManager from '../../../manager/profilesManager';
import Button from '../../../component/button/button';
import Detail from '../../../component/detail/detail';
import Checkbox from '../../../component/checkbox/checkbox';
import SettingsManager from '../../../manager/settingsManager';
import InputContainer from '../components/inputcontainer';
import Global from '../../../util/global';
import LauncherManager from '../../../manager/launcherManager';
import FSU from '../../../util/fsu';
import Overlay from '../../../component/overlay/overlay';
import ProfileSelector from '../../../component/profileSelector/profileSelector';
import AlertBackground from '../../../component/alert/alertbackground';
import ToastManager from '../../../manager/toastManager';
import LatestProfile from '../../../defaultProfiles/latestProfile';
import logInit from '../../../util/logger';

const logger = logInit('EditPageAdvanced');

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
  }

  &:not(:nth-child(2)) {
    button {
      width: 285px;
      text-align: left;
    }
  }
`;

export default function EditPageAdvanced({ id }) {
  const profile = ProfilesManager.getProfileFromID(id);

  const [runSnapshotInSeperateFolder, setRunSnapshotInSeperateFolder] = useState(
    SettingsManager.currentSettings.runSnapshotInSeperateFolder
  );

  const [syncOptionsTXT, setSyncOptionsTXT] = useState(profile.mcm.syncOptionsTXT);
  const [syncOptionsOF, setSyncOptionsOF] = useState(profile.mcm.syncOptionsOF);
  const [syncServers, setSyncServers] = useState(profile.mcm.syncServers);
  const [currentCopyObject, setCurrentCopyObject] = useState('');
  const [copyObjectReadable, setCopyObjectReadable] = useState('');
  const [showCopyOverlay, setShowCopyOverlay] = useState(false);

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
    LauncherManager.updateGameDir(profile);
  };

  const symlinkFile = (doLink, fileName) => {
    FSU.deleteFileIfExists(path.join(profile.gameDir, fileName));
    if (doLink) {
      FSU.createFileIfMissing(path.join(Global.getMCPath(), fileName));
      fs.linkSync(path.join(Global.getMCPath(), fileName), path.join(profile.gameDir, fileName));
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

  return (
    <>
      <Overlay in={showCopyOverlay}>
        <AlertBackground>
          <h1>copy to...</h1>
          <p>
            where do you want to copy the <b>{copyObjectReadable}</b> to?
          </p>

          <ProfileSelector hideProfile={profile.id} onSelect={onCopySelect} />

          <div className="buttons">
            <Button color="red" onClick={() => setShowCopyOverlay(false)}>
              cancel
            </Button>
          </div>
        </AlertBackground>
      </Overlay>
      <div>
        <Panel>
          <h3>Sync Options</h3>

          {profile.id !== '0-default-profile-latest' && runSnapshotInSeperateFolder && (
            <>
              <InputContainer>
                <Checkbox lighter checked={syncOptionsTXT} onClick={syncOptionsTXTClick} />
                Sync in-game Minecraft Options with this profile
              </InputContainer>

              <InputContainer>
                <Checkbox lighter checked={syncOptionsOF} onClick={syncOptionsOFClick} />
                Sync in-game OptiFine Options with this profile
              </InputContainer>

              <InputContainer>
                <Checkbox lighter checked={syncServers} onClick={syncServersClick} />
                Sync in-game Server List with this profile
              </InputContainer>
              <br />
            </>
          )}

          <Button color="green" onClick={copyOptionsTXT}>
            copy in-game minecraft options to...
          </Button>

          <Button color="green" onClick={copyOptionsOF}>
            copy in-game optifine options to...
          </Button>

          <Button color="green" onClick={copyServers}>
            copy in-game servers list to...
          </Button>
        </Panel>
        <Panel>
          <h3>Advanced Info</h3>
          <Button color="red" onClick={() => profile.openGameDir()}>
            open profile folder
          </Button>

          <Detail>internal id: {profile.id}</Detail>
          <Detail>version-safe name: {profile.safename}</Detail>
          <Detail>version timestamp: {profile.version.timestamp}</Detail>
          <Detail>OMAF version: {profile.omafVersion}</Detail>
          {profile.id === '0-default-profile-snapshot' && (
            <InputContainer>
              <Checkbox lighter checked={runSnapshotInSeperateFolder} onClick={snapshotSeperateFolderClick} />
              Run in a seperate game directory from Latest release
            </InputContainer>
          )}
        </Panel>
        <Panel>
          <h3>Technical Functions</h3>
          <Button color="red" onClick={() => shell.openExternal(path.join(profile.profilePath, '/profile.json'))}>
            open profile.json
          </Button>
          <Button
            color="red"
            onClick={() => shell.openExternal(path.join(profile.profilePath, '/_omaf/subAssets/mods.json'))}
          >
            open subAssets/mods.json
          </Button>
          <Button
            color="red"
            onClick={() => shell.openExternal(path.join(profile.profilePath, '/_omaf/subAssets/resourcepacks.json'))}
          >
            open subAssets/resourcepacks.json
          </Button>
          <Button
            color="red"
            onClick={() => shell.openExternal(path.join(profile.profilePath, '/_omaf/subAssets/worlds.json'))}
          >
            open subAssets/worlds.json
          </Button>
          <Button color="red" onClick={() => shell.openExternal(profile.profilePath)}>
            open OMAF data folder
          </Button>
        </Panel>
      </div>
    </>
  );
}

EditPageAdvanced.propTypes = {
  id: PropTypes.string.isRequired
};
