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

const logger = logInit('EditPageAdvancedSync');

export default function Sync(params) {
  const profile = params.profile;
  const [syncOptionsTXT, setSyncOptionsTXT] = useState(profile.mcm.syncOptionsTXT);
  const [syncOptionsOF, setSyncOptionsOF] = useState(profile.mcm.syncOptionsOF);
  const [syncServers, setSyncServers] = useState(profile.mcm.syncServers);
  const [currentCopyObject, setCurrentCopyObject] = useState('');
  const [copyObjectReadable, setCopyObjectReadable] = useState('');
  const [showCopyOverlay, setShowCopyOverlay] = useState(false);

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
      <Panel>
        <h3>Sync Options</h3>

        {profile.id !== '0-default-profile-latest' && (
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
    </>
  );
}

Sync.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  profile: PropTypes.object
};
