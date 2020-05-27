import React, { useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button, TextInput, Detail, Checkbox, InputHolder, Dropdown, withTheme } from '@theemeraldtree/emeraldui';
import SettingsManager from '../../../manager/settingsManager';
import Global from '../../../util/global';
import ProfilesManager from '../../../manager/profilesManager';
import LauncherManager from '../../../manager/launcherManager';

const { dialog } = require('electron').remote;
const os = require('os');

const Settings = styled.div`
  margin: 10px;
`;

const WarningMSG = styled.p`
  color: red;
`;

const PathInput = styled(TextInput)`
  && {
    width: 590px;
    font-size: 13pt;
  }
`;

const LaunchContainer = styled.div`
  margin-top: 30px;
`;

function getMCAccounts() {
  const final = [];
  const accounts = LauncherManager.getMCAccounts();
  Object.keys(accounts).forEach(acc => {
    final.push({
      id: acc,
      name: Object.values(accounts[acc].profiles)[0].displayName
    });
  });

  return final;
}

function General({ theme }) {
  const [mcHome, setMCHome] = useState(SettingsManager.MC_HOME);
  const [mcExe, setMCExe] = useState(SettingsManager.currentSettings.mcExe);
  const [dedicatedRam, setDedicatedRam] = useState(SettingsManager.currentSettings.dedicatedRam);
  const [ramChangeDisabled, setRamChangeDisabled] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [minecraftAccounts] = useState(getMCAccounts());
  const [javaPath, setJavaPath] = useState(SettingsManager.currentSettings.java.path);

  const chooseHomeDirectory = () => {
    const p = dialog.showOpenDialog({
      title: 'Choose your Minecraft Home Directory',
      defaultPath: Global.getDefaultMinecraftPath(),
      buttonLabel: 'Select Directory',
      properties: ['openDirectory', 'showHiddenFiles']
    });

    if (p[0]) {
      SettingsManager.setHomeDirectory(p[0]);
      setMCHome(p[0]);
    }
  };

  const chooseMCExe = () => {
    let properties;
    if (os.platform() === 'win32') {
      properties = ['openFile', 'showHiddenFiles'];
    } else if (os.platform() === 'darwin') {
      properties = ['openDirectory', 'showHiddenFiles', 'treatPackageAsDirectory'];
    }
    const p = dialog.showOpenDialog({
      title: 'Choose your Minecraft Executable',
      defaultPath: Global.getDefaultMCExePath(),
      buttonLabel: 'Select File',
      properties
    });

    if (p[0]) {
      SettingsManager.setMCExe(p[0]);
      setMCExe(p[0]);
    }
  };

  const ramAmountChange = e => {
    const newAmount = e.target.value;
    const oldAmount = SettingsManager.currentSettings.dedicatedRam.toString();

    if (/^[0-9\b]+$/.test(newAmount) || newAmount === '') {
      setRamChangeDisabled(true);
      setDedicatedRam(newAmount);
      const intAmount = parseInt(newAmount);
      if (intAmount >= Math.ceil(os.totalmem() / 1073741824)) {
        setWarningMessage('That is equal to or higher than your available RAM! Please set it lower!');
      } else if (newAmount === '') {
        setWarningMessage('Please enter a value');
      } else if (intAmount === 0) {
        setWarningMessage('You need to provide SOME amount of RAM!');
      } else {
        setRamChangeDisabled(newAmount === oldAmount);
        setWarningMessage('');
      }
    }
  };

  const javaPathChange = e => {
    setJavaPath(e.target.value);
  };

  const changeJavaPath = () => {
    SettingsManager.currentSettings.java.path = javaPath;
  };

  const changeRAM = () => {
    if (!ramChangeDisabled) {
      SettingsManager.setDedicatedRam(dedicatedRam);
      setRamChangeDisabled(true);
    }
  };

  const toggleSetting = setting => {
    SettingsManager.currentSettings[setting] = !SettingsManager.currentSettings[setting];
    SettingsManager.save();
    forceUpdate();
  };

  const allowSnapshotProfileClick = () => {
    toggleSetting('allowSnapshotProfile');
    ProfilesManager.getProfiles();
  };

  const checkToastNewsClick = () => {
    toggleSetting('checkToastNews');
  };

  const closeOnLaunchClick = () => {
    toggleSetting('closeOnLaunch');
  };

  const changeMCAccount = acc => {
    SettingsManager.currentSettings.mcAccount = acc;
    SettingsManager.save();
    forceUpdate();
  };

  return (
    <>
      <Settings>
        <InputHolder vertical>
          <Detail>minecraft home directory</Detail>
          <div>
            <PathInput theme={theme} disabled value={mcHome} />
            <Button onClick={chooseHomeDirectory} color="green">
              choose
            </Button>
          </div>
        </InputHolder>
        <InputHolder vertical>
          <Detail>minecraft executable</Detail>
          <div>
            <PathInput theme={theme} disabled value={mcExe} />
            <Button onClick={chooseMCExe} color="green">
              choose
            </Button>
          </div>
        </InputHolder>
        <InputHolder vertical>
          <Detail>dedicated ram (gb)</Detail>
          <div>
            <TextInput onChange={ramAmountChange} value={dedicatedRam} />
            <Button disabled={ramChangeDisabled} onClick={changeRAM} color="green">
              change
            </Button>
          </div>
          <WarningMSG>{warningMessage}</WarningMSG>
        </InputHolder>
        <InputHolder>
          <Checkbox
            checked={SettingsManager.currentSettings.allowSnapshotProfile}
            lighter
            onClick={allowSnapshotProfileClick}
          />
          <Detail>show latest snapshot profile</Detail>
        </InputHolder>
        <InputHolder>
          <Checkbox checked={SettingsManager.currentSettings.checkToastNews} lighter onClick={checkToastNewsClick} />
          <Detail>check for news on startup</Detail>
        </InputHolder>
        <InputHolder>
          <Checkbox checked={SettingsManager.currentSettings.analyticsEnabled} lighter onClick={() => toggleSetting('analyticsEnabled')} />
          <Detail>enable anonymous, privacy-respecting analytics</Detail>
        </InputHolder>
        <InputHolder>
          <Checkbox checked={SettingsManager.currentSettings.closeOnLaunch} lighter onClick={closeOnLaunchClick} />
          <Detail>close minecraft manager on profile launch</Detail>
        </InputHolder>
        <LaunchContainer>
          <Detail>Minecraft account to use for Launching</Detail>
          <Dropdown
            items={minecraftAccounts}
            value={SettingsManager.currentSettings.mcAccount}
            onChange={changeMCAccount}
          />
          <Detail>Add an account via the standard Minecraft Launcher</Detail>
        </LaunchContainer>
        <InputHolder>
          <Detail>java path</Detail>
          <div>
            <TextInput onChange={javaPathChange} value={javaPath} />
            <Button onClick={changeJavaPath} color="green">
              change
            </Button>
          </div>
        </InputHolder>
      </Settings>
    </>
  );
}

General.propTypes = {
  theme: PropTypes.object
};

export default withTheme(General);
