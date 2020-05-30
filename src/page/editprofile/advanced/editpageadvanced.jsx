/* eslint-disable */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import path from 'path';
import { shell } from 'electron';
import fs from 'fs';
import { Button, Detail, Checkbox, InputHolder } from '@theemeraldtree/emeraldui';
import ProfilesManager from '../../../manager/profilesManager';
import SettingsManager from '../../../manager/settingsManager';
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


export default function EditPageAdvanced({ id }) {
  const profile = ProfilesManager.getProfileFromID(id);

  const [runSnapshotInSeperateFolder, setRunSnapshotInSeperateFolder] = useState(
    SettingsManager.currentSettings.runSnapshotInSeperateFolder
  );

  const [runLatestInIntegrated, setRunLatestInIntegrated] = useState(SettingsManager.currentSettings.runLatestInIntegrated);


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


  const runLatestInIntegratedClick = () => {
    const inverted = !runLatestInIntegrated;
    setRunLatestInIntegrated(inverted);
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
              <InputHolder>
                <Checkbox lighter checked={syncOptionsTXT} onClick={syncOptionsTXTClick} />
                Sync in-game Minecraft Options with this profile
              </InputHolder>

              <InputHolder>
                <Checkbox lighter checked={syncOptionsOF} onClick={syncOptionsOFClick} />
                Sync in-game OptiFine Options with this profile
              </InputHolder>

              <InputHolder>
                <Checkbox lighter checked={syncServers} onClick={syncServersClick} />
                Sync in-game Server List with this profile
              </InputHolder>
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
        
      </div>
    </>
  );
}

EditPageAdvanced.propTypes = {
  id: PropTypes.string.isRequired
};
