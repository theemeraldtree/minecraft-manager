import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Detail, InputHolder, Button, withTheme, TextBox, Spinner } from '@theemeraldtree/emeraldui';
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
import useDebounced from '../../../util/useDebounced';
import PathInput from '../components/pathInput';
import MCLauncherIntegrationHandler from '../../../minecraft/mcLauncherIntegrationHandler';
import AlertManager from '../../../manager/alertManager';

const { dialog } = require('electron').remote;

const VersionPanel = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: #454547;
  transition: filter 150ms;
  width: calc(100% - 35px);
  border-radius: 5px;
  ${props => props.disabled && css`
    filter: brightness(0.65);
    cursor: not-allowed;
  `}
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

function Java({ theme, profileScope }) {
  const [disableStandardJava, setDisableStandardJava] = useState(!profileScope ? SettingsManager.currentSettings.java.manual : profileScope.mcm.java.manual);
  const [showJavaDialog, setShowJavaDialog] = useState(false);
  const [javaVersions, setJavaVersions] = useState([]);
  const [javaPath, setJavaPath] = useState(!profileScope ? SettingsManager.currentSettings.java.manualPath : profileScope.mcm.java.manualPath);
  const [ramValue, setRamValue] = useState(!profileScope ? SettingsManager.currentSettings.dedicatedRam : profileScope.mcm.java.dedicatedRam);
  const [ramError, setRamError] = useState('');
  const [javaArgsActive, setJavaArgsActive] = useState(!profileScope ? SettingsManager.currentSettings.java.customArgsActive : profileScope.mcm.java.overrideArgs);
  const [javaArgs, setJavaArgs] = useState(!profileScope ? SettingsManager.currentSettings.java.customJavaArgs : profileScope.mcm.java.customArgs);
  const [javaInstalling, setJavaInstalling] = useState(false);
  const [javaReleaseName, setJavaReleaseName] = useState(!profileScope ? SettingsManager.currentSettings.java.releaseName : profileScope.mcm.java.releaseName);
  const [overrideProfileJava, setOverrideProfileJava] = useState(profileScope ? profileScope.mcm.java.overridePath : false);
  const [overrideProfileRam, setOverrideProfileRam] = useState(profileScope ? profileScope.mcm.java.overrideRam : false);

  const doReingrate = () => {
    if (SettingsManager.currentSettings.launcherIntegration) MCLauncherIntegrationHandler.integrateProfiles(false);
  };

  const javaArgsDebounced = useDebounced((args) => {
    if (!profileScope) {
      SettingsManager.currentSettings.java.customJavaArgs = args;
      SettingsManager.save();
    } else {
      profileScope.setOverride('java-custom-args', args);
    }
    doReingrate();
  }, 200);

  const ramDebounced = useDebounced((ram) => {
    if (!profileScope) {
      SettingsManager.setDedicatedRam(ram);
    } else {
      profileScope.setOverride('custom-ram', ram);
    }
    doReingrate();
  }, 200);

  const osMemory = Math.ceil(os.totalmem() / 1073741824);

  const changeJavaVersion = () => {
    setShowJavaDialog(true);
  };

  const installJavaClick = async ver => {
    setJavaInstalling(true);

    let installPath;
    if (!profileScope) installPath = path.join(Global.MCM_PATH, '/shared/binaries/java');
    if (profileScope) installPath = path.join(profileScope.mcmPath, '/binaries/java/');
    const version = await JavaHandler.installVersion(ver, installPath);
    setJavaInstalling(false);
    if (version !== 'error') {
      if (!profileScope) {
        SettingsManager.currentSettings.java.path = path.join(installPath, JavaHandler.getDefaultJavaPath());
        SettingsManager.currentSettings.java.releaseName = version;
        SettingsManager.save();
      } else {
        profileScope.setOverride('java-install-path', path.join(installPath, JavaHandler.getDefaultJavaPath()));
        profileScope.setOverride('java-releasename', version);
      }
      setJavaReleaseName(version);

      doReingrate();
    }
  };

  const getJavaVersions = async () => {
    setJavaVersions([]);
    try {
      setJavaVersions(await JavaHandler.getJavaVersionsForInstaller());
    } catch (e) {
      setJavaVersions(['network-error']);
    }
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

    if (p && p[0]) {
      setJavaPath(p[0]);

      if (!profileScope) {
        SettingsManager.currentSettings.java.manualPath = p[0];
        SettingsManager.currentSettings.java.manual = true;

        SettingsManager.save();
      } else {
        profileScope.setOverride('java-manual-path', p[0]);
        profileScope.setOverride('java-manual', true);
      }

      doReingrate();
    }
  };

  const switchBetween = (val) => {
    setDisableStandardJava(val);

    if (!profileScope) {
      SettingsManager.currentSettings.java.manual = val;
      SettingsManager.save();
    } else {
      profileScope.setOverride('java-manual', val);
    }

    doReingrate();
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
      ramDebounced(value);
      setRamError('');
    }
  };

  const javaArgsToggle = () => {
    if (!profileScope) {
      SettingsManager.currentSettings.java.customArgsActive = !javaArgsActive;
      SettingsManager.save();
    } else {
      profileScope.setOverride('java-args', !javaArgsActive);
    }
    setJavaArgsActive(!javaArgsActive);
    doReingrate();
  };


  const javaArgsChange = e => {
    setJavaArgs(e.target.value);
    javaArgsDebounced(e.target.value);
  };

  const overrideProfileJavaClick = () => {
    profileScope.setOverride('java-path', !overrideProfileJava);
    setOverrideProfileJava(!overrideProfileJava);
    doReingrate();
  };

  const overrideProfileRamClick = () => {
    profileScope.setOverride('ram', !overrideProfileRam);
    profileScope.save();
    setOverrideProfileRam(!overrideProfileRam);
    doReingrate();
  };

  const helpJavaArgs = () => {
    AlertManager.messageBox(
      'Custom Java arguments',
      `Minecraft Manager allows you to configure custom Java arguments that are included when Minecraft is ran.
      <br><br>
       These settings are advanced, so it's only recommended to change them if you know what you're doing.`
    );
  };

  return (
    <>
      <InstallWizard
        cancelClick={() => setShowJavaDialog(false)}
        installClick={installJavaClick}
        name="Java"
        simpleText="The latest version of Java 8 will be installed."
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
      {profileScope && (
        <>
          <InputHolder>
            <ToggleSwitch onClick={overrideProfileRamClick} value={overrideProfileRam} />
            <Detail>Override Global Dedicated RAM Settings</Detail>
          </InputHolder>
          <Gap />
        </>
      )}
      <DisabledBox active={!profileScope || (profileScope && overrideProfileRam)}>
        <Slider disabled={profileScope && !overrideProfileRam} label="Dedicated RAM (GB)" min={1} max={osMemory - 1} step={1} value={ramValue} onChange={ramChange} />
      </DisabledBox>
      {ramError && <RAMError>{ramError}</RAMError>}
      <SettingSeperator />
      <InputHolder>
        <ToggleSwitch onClick={javaArgsToggle} value={javaArgsActive} />
        <Detail>Custom Java Arguments <QuestionButton onClick={helpJavaArgs} /></Detail>
      </InputHolder>
      <EmptyOffset>
        <DisabledBox active={javaArgsActive}>
          <TextBox value={javaArgs} onChange={javaArgsChange} disabled={!javaArgsActive} />
        </DisabledBox>
      </EmptyOffset>

      <SettingSeperator />

      {profileScope && (
        <>
          <InputHolder>
            <ToggleSwitch onClick={overrideProfileJavaClick} value={overrideProfileJava} />
            <Detail>Override Global Java Settings</Detail>
          </InputHolder>
          <Gap />
        </>
      )}


      <InputHolder>
        <SettingsRadioButton disabled={profileScope && !overrideProfileJava} active={!disableStandardJava} onClick={() => switchBetween(false)} />
        <FadedDetail active={!(disableStandardJava || (profileScope && !overrideProfileJava))}>Let Minecraft Manager handle Java Installation</FadedDetail>
      </InputHolder>
      <EmptyOffset>
        <VersionPanel disabled={disableStandardJava || (profileScope && !overrideProfileJava)}>
          <p>Currently using JRE version <b>{javaReleaseName}</b></p>
          <Button disabled={disableStandardJava || (profileScope && !overrideProfileJava)} onClick={changeJavaVersion} color="green">Change version</Button>
        </VersionPanel>
      </EmptyOffset>

      <Gap />

      <InputHolder>
        <SettingsRadioButton disabled={profileScope && !overrideProfileJava} active={disableStandardJava} onClick={() => switchBetween(true)} />
        <FadedDetail active={(disableStandardJava && !profileScope) || (profileScope && overrideProfileJava && disableStandardJava)}>Manually set Java path</FadedDetail>
      </InputHolder>
      <EmptyOffset>
        <DisabledBox active={(disableStandardJava && !profileScope) || (profileScope && overrideProfileJava && disableStandardJava)}>
          <InputHolder text vertical>
            <PathInput theme={theme} readOnly value={javaPath} />
            <Button onClick={chooseJavaPath} color="green">
              Browse
            </Button>
          </InputHolder>
        </DisabledBox>
      </EmptyOffset>

    </>
  );
}

Java.propTypes = {
  theme: PropTypes.object,
  profileScope: PropTypes.object
};

export default withTheme(Java);
