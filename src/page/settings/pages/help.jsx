import React, { useState } from 'react';
import styled from 'styled-components';
import NeedHelp from '../components/needhelp';
import Section from '../components/section';
import Button from '../../../component/button/button';
import LibrariesManager from '../../../manager/librariesManager';
import VersionsManager from '../../../manager/versionsManager';
import LauncherManager from '../../../manager/launcherManager';
import AlertManager from '../../../manager/alertManager';
import Debug from '../../../util/debug';

const List = styled.div`
  display: flex;
  flex-flow: column;
  button {
    margin-top: 3px;
    width: auto;
    max-width: 300px;
  }
`;

export default function Help() {
  const [action, setAction] = useState('');

  const confirmAction = () => {
    switch (action) {
      case 'clean-launcher-profiles':
        LauncherManager.cleanMinecraftProfiles();
        break;
      case 'clean-launcher-libraries':
        LibrariesManager.cleanLibraries();
        break;
      case 'clean-launcher-versions':
        VersionsManager.cleanVersions();
        break;
      default:
        break;
    }
  };

  const prepareAction = act => {
    setAction(act);
    AlertManager.alert(
      'this can be dangerous!',
      'are you sure? this is a potentially dangerous operation that can screw up your game!',
      confirmAction
    );
  };

  const dumpData = () => {
    AlertManager.messageBox('data dump', `<textarea readonly>${Debug.dataDump()}</textarea>`);
  };

  return (
    <>
      <NeedHelp />
      <Section>
        <h2>Advanced Troubleshooting Functions</h2>
        <h3>
          <b>Warning!</b> These are advanced functions that, if used wrong, can seriously screw up your game! Proceed
          with caution!
        </h3>
        <List>
          <Button onClick={() => prepareAction('clean-launcher-profiles')} color="red">
            clean launcher profiles
          </Button>
          <Button onClick={() => prepareAction('clean-launcher-libraries')} color="red">
            clean launcher libraries
          </Button>
          <Button onClick={() => prepareAction('clean-launcher-versions')} color="red">
            clean launcher versions
          </Button>
        </List>
      </Section>
      <Section>
        <h2>Minecraft Manager Data Dump</h2>
        <h3>Dumps most of the data that Minecraft Manager has. This can be helpful for error/crash reports.</h3>
        <Button onClick={dumpData} color="green">
          dump data
        </Button>
      </Section>
    </>
  );
}
