import React, { useState } from 'react';
import styled from 'styled-components';
import TextInput from '../../../component/textinput/textinput';
import Button from '../../../component/button/button';
import Detail from '../../../component/detail/detail';
import InputHolder from '../../../component/inputholder/inputholder';
import SettingsManager from '../../../manager/settingsManager';
import Global from '../../../util/global';
const { dialog } = require('electron').remote;
const os = require('os');

const Settings = styled.div`
  margin: 10px;
`;

const WarningMSG = styled.p`
  color: red;
`;

const PathInput = styled(TextInput)`
  width: 590px;
  font-size: 13pt;
`;

export default function General() {
  const [mcHome, setMCHome] = useState(SettingsManager.MC_HOME);
  const [mcExe, setMCExe] = useState(SettingsManager.currentSettings.mcExe);
  const [dedicatedRam, setDedicatedRam] = useState(
    SettingsManager.currentSettings.dedicatedRam
  );
  const [ramChangeDisabled, setRamChangeDisabled] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');
  const chooseHomeDirectory = () => {
    let p = dialog.showOpenDialog({
      title: 'Choose your Minecraft Home Directory',
      defaultPath: Global.getDefaultMinecraftPath(),
      buttonLabel: 'Select Directory',
      properties: ['openDirectory', 'showHiddenFiles'],
    });
    SettingsManager.setHomeDirectory(p[0]);
    setMCHome(p[0]);
  };

  const chooseMCExe = () => {
    let properties;
    if (os.platform() === 'win32') {
      properties = ['openFile', 'showHiddenFiles'];
    } else if (os.platform() === 'darwin') {
      properties = [
        'openDirectory',
        'showHiddenFiles',
        'treatPackageAsDirectory',
      ];
    }
    let p = dialog.showOpenDialog({
      title: 'Choose your Minecraft Executable',
      defaultPath: Global.getDefaultMCExePath(),
      buttonLabel: 'Select File',
      properties: properties,
    });
    SettingsManager.setMCExe(p[0]);
    setMCExe(p[0]);
  };

  const ramAmountChange = e => {
    let newAmount = e.target.value;
    let oldAmount = SettingsManager.currentSettings.dedicatedRam.toString();

    if (/^[0-9\b]+$/.test(newAmount) || newAmount === '') {
      setRamChangeDisabled(true);
      setDedicatedRam(newAmount);
      let intAmount = parseInt(newAmount);
      if (intAmount >= Math.ceil(os.totalmem() / 1073741824)) {
        setWarningMessage(
          `That is equal to or higher than your available RAM! Please set it lower!`
        );
      } else if (newAmount === '') {
        setWarningMessage(`Please enter a value`);
      } else if (intAmount === 0) {
        setWarningMessage(`You need to provide SOME amount of RAM!`);
      } else {
        setRamChangeDisabled(newAmount === oldAmount);
        setWarningMessage('');
      }
    }
  };

  const changeRAM = () => {
    if (!ramChangeDisabled) {
      SettingsManager.setDedicatedRam(dedicatedRam);
      setRamChangeDisabled(true);
    }
  };

  return (
    <>
      <Settings>
        <InputHolder>
          <Detail>minecraft home directory</Detail>
          <div>
            <PathInput disabled value={mcHome} />
            <Button onClick={chooseHomeDirectory} color="green">
              choose
            </Button>
          </div>
        </InputHolder>
        <InputHolder>
          <Detail>minecraft executable</Detail>
          <div>
            <PathInput disabled value={mcExe} />
            <Button onClick={chooseMCExe} color="green">
              choose
            </Button>
          </div>
        </InputHolder>
        <InputHolder>
          <Detail>dedicated ram (gb)</Detail>
          <div>
            <TextInput onChange={ramAmountChange} value={dedicatedRam} />
            <Button
              disabled={ramChangeDisabled}
              onClick={changeRAM}
              color="green"
            >
              change
            </Button>
          </div>
          <WarningMSG>{warningMessage}</WarningMSG>
        </InputHolder>
      </Settings>
    </>
  );
}
