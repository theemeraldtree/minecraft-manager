import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Button, TextInput, Detail, Checkbox, InputHolder, withTheme } from '@theemeraldtree/emeraldui';
import Global from '../../util/global';
import SettingsManager from '../../manager/settingsManager';
import LibrariesManager from '../../manager/librariesManager';
import logo from '../../img/logo-sm.png';
import NavContext from '../../navContext';
import tipShare from './img/tip-share.png';
import tipRightClick from './img/tip-right-click.png';
import LauncherManager from '../../manager/launcherManager';
import Analytics from '../../util/analytics';

const { dialog } = require('electron').remote;

const Title = styled.p`
  color: white;
  font-size: 26pt;
  font-weight: 200;
  margin: 0;
`;

const WelcomeBox = styled.div`
  background-color: #404040;
  max-width: 600px;
  padding: 10px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column;
`;

const Subtext = styled.p`
  color: white;
  margin: 0;
`;

const Content = styled.div`
  padding: 5px;
  display: flex;
  align-items: center;
  flex-flow: column;
  color: white;

  img {
    width: 200px;
  }

  h3 {
    font-size: 21pt;
  }

  p {
    font-size: 15pt;
    max-width: 500px;
    text-align: center;
  }

  input {
    font-size: 13pt;
  }
`;

const Logo = styled.div`
  background-image: url(${logo});
  width: 150px;
  height: 150px;
  background-size: contain;
`;

const TI = styled(TextInput)`
  &&&& {
    max-width: 680px;
    width: 100%;
  }
`;

const GB = styled(Button)`
  margin-top: 20px;
`;

const IH = styled(InputHolder)`
  && {
    margin-top: 1px;
    max-width: 650px;
    width: 100%;

    div {
      width: 100%;
    }
  }
`;

const Spacing = styled.div`
  width: 100%;
  height: 30px;
`;

const AutofillText = styled.p`
  margin: 0;
  font-size: 10pt !important;
  color: white;
`;

const LeftSubText = styled(Subtext)`
  text-align: left !important;
  font-size: 13pt !important;
  margin-top: 20px !important;
  margin-bottom: 5px !important;
  padding: 10px;
  background-color: #404040;
`;

function WelcomePage({ history, theme }) {
  const nav = useContext(NavContext);

  const [mcHome, setMCHome] = useState(Global.getDefaultMinecraftPath());
  const [mcExe, setMCExe] = useState(Global.getDefaultMCExePath());
  const [step, setStep] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    nav.header.setTitle('welcome');
    nav.header.setShowChildren(false);
  });

  const nextStep = () => {
    setStep(step + 1);
  };

  const chooseHomeDirectory = () => {
    const p = dialog.showOpenDialog({
      title: 'Choose your Minecraft Home Directory',
      defaultPath: Global.getDefaultMinecraftPath(),
      buttonLabel: 'Select Directory',
      properties: ['openDirectory', 'showHiddenFiles']
    });
    if (p[0]) {
      setMCHome(p[0]);
    }
  };

  const start = async () => {
    setPreparing(true);
    SettingsManager.setHomeDirectory(mcHome);
    SettingsManager.setMCExe(mcExe);

    SettingsManager.currentSettings.mcAccount = Object.keys(LauncherManager.getMCAccounts())[0];
    SettingsManager.currentSettings.analyticsEnabled = analyticsEnabled;
    SettingsManager.currentSettings.lastVersion = Global.MCM_VERSION;
    SettingsManager.save();

    if (analyticsEnabled) Analytics.send('first-install');

    const mcl = path.join(LibrariesManager.getLibrariesPath(), '/minecraftmanager');
    if (!fs.existsSync(mcl)) {
      fs.mkdirSync(mcl);
    }

    if (!fs.existsSync(LibrariesManager.getMCMLibraries())) {
      fs.mkdirSync(LibrariesManager.getMCMLibraries());
    }

    const result = await Global.updateMCVersions(true);

    fs.mkdirSync(path.join(Global.MCM_TEMP));

    if (result === 'no-connection') {
      setPreparing(false);
    } else {
      if (!fs.existsSync(Global.PROFILES_PATH)) {
        fs.mkdirSync(Global.PROFILES_PATH);
      }
      history.push('/');
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
      setMCExe(p[0]);
    }
  };

  const analyticsClick = () => {
    setAnalyticsEnabled(!analyticsEnabled);
  };

  return (
    <>
      <Content>
        <Spacing />
        {!preparing && (
          <>
            {step === 0 && (
              <>
                <WelcomeBox>
                  <Logo />
                  <Title>Welcome to Minecraft Manager</Title>
                  <Subtext>The easiest way to manage your Minecraft Launcher</Subtext>
                </WelcomeBox>
                <GB onClick={nextStep} color="green">
                  continue
                </GB>
              </>
            )}

            {step === 1 && (
              <>
                <WelcomeBox>
                  <Title>A quick word about your Launcher</Title>
                </WelcomeBox>
                <LeftSubText>
                  <b>
                    Minecraft Manager is very different from any other 3rd-party Minecraft Launcher you might've used.
                  </b>
                  <br />
                  <br />
                  Minecraft Manager adds your Profiles and Modpacks directly to the vanilla Minecraft Launcher, unlike
                  other launchers.
                  <br />
                  <br />
                  This may seem strange, but it allows for everything you do that's Minecraft-related to be in one
                  place.
                </LeftSubText>
                <LeftSubText>
                  Before continuing with setup, it's recommended that you{' '}
                  <b>backup anything in your .minecraft folder that you don't want to lose,</b> in case something goes
                  wrong
                </LeftSubText>
                <GB onClick={nextStep} color="green">
                  continue with setup
                </GB>
              </>
            )}

            {step === 2 && (
              <>
                <Spacing />
                <Title>Is this where your .minecraft folder is?</Title>

                <IH>
                  <div>
                    <TI theme={theme} disabled value={mcHome} />
                    <Button onClick={chooseHomeDirectory} color="green">
                      change
                    </Button>
                  </div>
                </IH>
                <AutofillText>
                  Most people will not have changed this. However if you have, please update it accordingly.
                </AutofillText>

                <GB onClick={nextStep} color="green">
                  continue
                </GB>
              </>
            )}

            {step === 3 && (
              <>
                <Spacing />
                <Title>Is this where your Minecraft Executable is?</Title>

                <IH>
                  <div>
                    <TI theme={theme} disabled value={mcExe} />
                    <Button onClick={chooseMCExe} color="green">
                      change
                    </Button>
                  </div>
                </IH>
                <AutofillText>
                  Most people will not have changed this. However if you have, please update it accordingly.
                </AutofillText>

                <GB onClick={nextStep} color="green">
                  continue
                </GB>
              </>
            )}

            {step === 4 && (
              <>
                <Spacing />
                <Title>Analytics</Title>

                <p>
                  Minecraft Manager contains anonymous, privacy-respecting analytics. <br />
                  Would you like these to be enabled?
                </p>

                <InputHolder>
                  <Checkbox lighter checked={analyticsEnabled} onClick={analyticsClick} />
                  <Detail>Enable Analytics</Detail>
                </InputHolder>

                <GB onClick={nextStep} color="green">
                  continue
                </GB>
              </>
            )}

            {step === 5 && (
              <>
                <Spacing />
                <Title>You're all set!</Title>

                <h3>You're done setting up Minecraft Manager.</h3>
                <p>
                  Check out these tips and tricks to see what you can do. <br />
                  If you want more,{' '}
                  <a href="https://theemeraldtree.net/mcm/wiki">check out the Minecraft Manager wiki.</a>
                </p>

                <GB onClick={nextStep} color="green">
                  next
                </GB>
              </>
            )}

            {step === 6 && (
              <>
                <Spacing />
                <Title>tips and tricks</Title>

                <img alt="Share your profile" src={tipShare} />

                <h3>
                  <b>share your profile</b>
                </h3>
                <p>Share your custom-made profile with your friends through a tiny, typically less than 1 MB file</p>

                <GB onClick={nextStep} color="green">
                  next tip
                </GB>
              </>
            )}

            {step === 7 && (
              <>
                <Spacing />
                <Title>tips and tricks</Title>

                <img alt="Right click" src={tipRightClick} />

                <h3>
                  <b>right click for more</b>
                </h3>

                <p>Right click various things to access hidden actions! Who knows what you'll discover!</p>

                <GB onClick={start} color="green">
                  finish setup
                </GB>
              </>
            )}
          </>
        )}

        {preparing && (
          <>
            <Title>performing first time setup</Title>
            <Subtext>this should only take a minute...</Subtext>
          </>
        )}
      </Content>
    </>
  );
}

WelcomePage.propTypes = {
  history: PropTypes.object.isRequired,
  theme: PropTypes.object
};

export default withTheme(withRouter(WelcomePage));
