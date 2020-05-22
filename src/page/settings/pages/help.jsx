import React from 'react';
import path from 'path';
import styled from 'styled-components';
import { shell } from 'electron';
import { Button } from '@theemeraldtree/emeraldui';
import NeedHelp from '../components/needhelp';
import Section from '../components/section';
import LibrariesManager from '../../../manager/librariesManager';
import VersionsManager from '../../../manager/versionsManager';
import LauncherManager from '../../../manager/launcherManager';
import AlertManager from '../../../manager/alertManager';
import Debug from '../../../util/debug';
import ProfilesManager from '../../../manager/profilesManager';
import Global from '../../../util/global';

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
  const confirmAction = act => {
    switch (act) {
      case 'clean-launcher-profiles':
        LauncherManager.cleanMinecraftProfiles();
        break;
      case 'clean-launcher-libraries':
        LibrariesManager.cleanLibraries();
        break;
      case 'clean-launcher-versions':
        VersionsManager.cleanVersions();
        break;
      case 'reload-profiles':
        ProfilesManager.getProfiles();
        break;
      default:
        break;
    }
  };

  const prepareAction = act => {
    AlertManager.alert(
      'this can be dangerous!',
      'are you sure? this is a potentially dangerous operation that can screw up your game!',
      () => confirmAction(act)
    );
  };

  const technicalAction = act => {
    switch (act) {
      case 'open-profiles-folder':
        shell.openItem(path.join(Global.PROFILES_PATH));
        break;
      case 'open-electron-logs-folder':
        shell.openItem(path.join(Global.MCM_PATH, '/logs/electron-process/'));
        break;
      case 'open-main-logs-folder':
        shell.openItem(path.join(Global.MCM_PATH, '/logs/main-node-process'));
        break;
      default:
        break;
    }
  };

  const dumpData = () => {
    AlertManager.messageBox('data dump', `<textarea readonly>${Debug.dataDump()}</textarea>`);
  };

  return (
    <>
      <NeedHelp />
      <Section>
        <h2>Technical Troubleshooting</h2>
        <List>
          <Button onClick={() => technicalAction('open-profiles-folder')} color="green">
            open profiles folder
          </Button>
          <Button onClick={() => technicalAction('open-electron-logs-folder')} color="green">
            open electron logs folder
          </Button>
          <Button onClick={() => technicalAction('open-main-logs-folder')} color="green">
            open main node logs folder
          </Button>
        </List>
      </Section>
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
          <Button onClick={() => prepareAction('reload-profiles')} color="red">
            force reload profiles
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
