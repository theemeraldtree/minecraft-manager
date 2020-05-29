import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Detail, InputHolder, Button, TextInput, withTheme, TextBox, Spinner } from '@theemeraldtree/emeraldui';
import os from 'os';
import path from 'path';
import SettingsManager from '../../../manager/settingsManager';
import InstallWizard from '../../../component/installWizard/installWizard';
import JavaHandler from '../../../minecraft/javaHandler';
import Global from '../../../util/global';
import Gap from '../components/gap';
import Slider from '../components/slider';
import EmptyOffset from '../components/emptyOffset';
import SettingSeperator from '../../../component/settingSeparator/settingSeparator';
import ToggleSwitch from '../../../component/toggleSwitch/toggleSwitch';
import QuestionButton from '../../../component/questionButton/questionButton';
import SettingsRadioButton from '../components/settingsRadioButton';
import Overlay from '../../../component/overlay/overlay';
import AlertBackground from '../../../component/alert/alertbackground';

const { dialog } = require('electron').remote;

const VersionPanel = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: #454547;
  transition: filter 150ms;
  width: calc(100% - 35px);
  ${props => props.disabled && css`
    filter: brightness(0.65);
    cursor: not-allowed;
  `}
`;

const PathInput = styled(TextInput)`
  cursor: default;
  font-size: 12pt;
  width: calc(100% - 100px);
`;

const RAMError = styled.p`
  color: red;
  margin: 0;
`;

const DisabledBox = styled.div`
  margin-top: 10px;
  textarea {
    width: calc(100% - 20px);
    height: 60px;
  }
  opacity: 0.5;
  transition: 150ms;
  ${props => props.active && css`
    opacity: 1;
  `}
`;

const FadedDetail = styled(Detail)`
  transition: opacity 150ms;
  ${props => !props.active && css`
    opacity: 0.5;
  `}
`;

const CenterSpinner = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 60px;
  flex-flow: column;
  margin-top: 20px;
  h2 {
    margin: 0;
  }
  h3 {
    margin: 0;
    margin-bottom: 40px;
    font-weight: 300;
  }
`;

function Java({ theme }) {
  const [disableStandardJava, setDisableStandardJava] = useState(SettingsManager.currentSettings.java.manual);
  const [showJavaDialog, setShowJavaDialog] = useState(false);
  const [javaVersions, setJavaVersions] = useState([]);
  const [javaPath, setJavaPath] = useState(SettingsManager.currentSettings.java.manualPath);
  const [ramValue, setRamValue] = useState(SettingsManager.currentSettings.dedicatedRam);
  const [ramError, setRamError] = useState('');
  const [javaArgsActive, setJavaArgsActive] = useState(SettingsManager.currentSettings.java.customArgsActive);
  const [javaArgs, setJavaArgs] = useState(SettingsManager.currentSettings.java.customJavaArgs);
  const [javaInstalling, setJavaInstalling] = useState(false);
  const [javaReleaseName, setJavaReleaseName] = useState(SettingsManager.currentSettings.java.releaseName);

  const osMemory = Math.ceil(os.totalmem() / 1073741824);

  const changeJavaVersion = () => {
    setShowJavaDialog(true);
  };

  const installJavaClick = async ver => {
    setJavaInstalling(true);
    const version = await JavaHandler.installVersion(ver, path.join(Global.MCM_PATH, '/shared/binaries/java/'));
    setJavaInstalling(false);
    SettingsManager.currentSettings.java.path = path.join(Global.MCM_PATH, '/shared/binaries/java/bin/java.exe');
    SettingsManager.currentSettings.java.releaseName = version;

    setJavaReleaseName(version);

    SettingsManager.save();
  };

  const getJavaVersions = async () => {
    setJavaVersions(await JavaHandler.getJavaVersionsForInstaller());
  };

  const chooseJavaPath = () => {
    const p = dialog.showOpenDialogSync({
      title: 'Choose your Java Executable',
      buttonLabel: 'Select File',
      properties: ['openFile', 'showHiddenFiles'],
      filters: [
        { name: 'Executable', extensions: ['exe'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (p[0]) {
      setJavaPath(p[0]);
      SettingsManager.currentSettings.java.manualPath = p[0];
      SettingsManager.currentSettings.java.manual = true;

      SettingsManager.save();
    }
  };

  const switchBetween = (val) => {
    setDisableStandardJava(val);
    SettingsManager.currentSettings.java.manual = val;

    SettingsManager.save();
  };

  const ramChange = (value) => {
    setRamValue(value);
    const intAmount = parseInt(value);
    if (intAmount >= Math.ceil(os.totalmem() / 1073741824)) {
      setRamError('That is equal to or higher than your available RAM! Please set it lower!');
    } else if (value === '') {
      setRamError('Please enter a value');
    } else if (intAmount === 0) {
      setRamError('Please enter a value');
    } else {
      SettingsManager.setDedicatedRam(value);
      setRamError('');
    }
  };

  const javaArgsToggle = () => {
    SettingsManager.currentSettings.java.customArgsActive = !javaArgsActive;
    SettingsManager.save();
    setJavaArgsActive(!javaArgsActive);
  };

  const javaArgsChange = e => {
    setJavaArgs(e.target.value);
    SettingsManager.currentSettings.java.customJavaArgs = e.target.value;
    SettingsManager.save();
  };

  return (
    <>
      <InstallWizard
        cancelClick={() => setShowJavaDialog(false)}
        installClick={installJavaClick}
        name="Java"
        show={showJavaDialog}
        versions={javaVersions}
        getVersions={getJavaVersions}
      />
      <Gap />
      <Overlay in={javaInstalling}>
        <AlertBackground>
          <CenterSpinner>
            <h2>Installing Java...</h2>
            <h3>Open the Downloads viewer in the sidebar to see progress</h3>
            <Spinner />
          </CenterSpinner>
        </AlertBackground>
      </Overlay>
      <Slider label="Dedicated RAM (GB)" min={1} max={osMemory} step={1} value={ramValue} onChange={ramChange} />
      {ramError && <RAMError>{ramError}</RAMError>}
      <SettingSeperator />
      <InputHolder>
        <ToggleSwitch onClick={javaArgsToggle} value={javaArgsActive} />
        <Detail>Custom Java Arguments <QuestionButton /></Detail>
      </InputHolder>
      <EmptyOffset>
        <DisabledBox active={javaArgsActive}>
          <TextBox value={javaArgs} onChange={javaArgsChange} disabled={!javaArgsActive} />
        </DisabledBox>
      </EmptyOffset>

      <SettingSeperator />

      <InputHolder>
        <SettingsRadioButton active={!disableStandardJava} onClick={() => switchBetween(false)} />
        <FadedDetail active={!disableStandardJava}>Let Minecraft Manager handle Java Installation</FadedDetail>
      </InputHolder>
      <EmptyOffset>
        <VersionPanel disabled={disableStandardJava}>
          <p>Currently using AdoptOpenJDK JRE version <b>{javaReleaseName}</b></p>
          <Button disabled={disableStandardJava} onClick={changeJavaVersion} color="green">change version</Button>
        </VersionPanel>
      </EmptyOffset>

      <Gap />

      <InputHolder>
        <SettingsRadioButton active={disableStandardJava} onClick={() => switchBetween(true)} />
        <FadedDetail active={disableStandardJava}>Manually set Java path</FadedDetail>
      </InputHolder>
      <EmptyOffset>
        <DisabledBox active={disableStandardJava}>
          <InputHolder vertical>
            <PathInput theme={theme} readOnly value={javaPath} />
            <Button onClick={chooseJavaPath} disabled={!disableStandardJava} color="green">
              browse
            </Button>
          </InputHolder>
        </DisabledBox>
      </EmptyOffset>
    </>
  );
}

Java.propTypes = {
  theme: PropTypes.object
};

export default withTheme(Java);
