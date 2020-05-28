import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Detail, Checkbox, InputHolder, Button, TextInput, withTheme } from '@theemeraldtree/emeraldui';
import path from 'path';
import Section from '../components/section';
import SettingsManager from '../../../manager/settingsManager';
import InstallWizard from '../../../component/installWizard/installWizard';
import JavaHandler from '../../../minecraft/javaHandler';
import Global from '../../../util/global';

const { dialog } = require('electron').remote;

const VersionPanel = styled.div`
  padding: 10px;
  background-color: #353535;
  transition: filter 150ms;
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

function Java({ theme }) {
  const [disableStandardJava, setDisableStandardJava] = useState(SettingsManager.currentSettings.java.manual);
  const [showJavaDialog, setShowJavaDialog] = useState(false);
  const [javaVersions, setJavaVersions] = useState([]);
  const [javaPath, setJavaPath] = useState(SettingsManager.currentSettings.java.manualPath);

  const changeJavaVersion = () => {
    setShowJavaDialog(true);
  };

  const installJavaClick = async ver => {
    const version = await JavaHandler.installVersion(ver, path.join(Global.MCM_PATH, '/shared/binaries/java/'));
    SettingsManager.currentSettings.java.path = path.join(Global.MCM_PATH, '/shared/binaries/java/bin/java.exe');
    SettingsManager.currentSettings.java.releaseName = version;

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

  const switchBetween = () => {
    const isManual = !disableStandardJava;
    setDisableStandardJava(isManual);
    if (isManual) {
      SettingsManager.currentSettings.java.manual = true;
    } else {
      SettingsManager.currentSettings.java.manual = false;
    }

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
      <Section>
        <h2>Global Java Configuration</h2>
        <Detail>These settings can be overriden by profiles</Detail>

        <VersionPanel disabled={disableStandardJava}>
          <h3>AdoptOpenJDK JRE</h3>
          <p>Version: {SettingsManager.currentSettings.java.releaseName}</p>
          <Button disabled={disableStandardJava} onClick={changeJavaVersion} color="green">change version</Button>
        </VersionPanel>

        <InputHolder>
          <Checkbox checked={disableStandardJava} onClick={switchBetween} />
          <Detail>Use Manual Java Path</Detail>
        </InputHolder>

        <VersionPanel disabled={!disableStandardJava}>
          <h3>Manual Java Path</h3>
          <InputHolder vertical>
            <PathInput theme={theme} readOnly value={javaPath} />
            <Button onClick={chooseJavaPath} disabled={!disableStandardJava} color="green">
              choose
            </Button>
          </InputHolder>
        </VersionPanel>
      </Section>
    </>
  );
}

Java.propTypes = {
  theme: PropTypes.object
};

export default withTheme(Java);
