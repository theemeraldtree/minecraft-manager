import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import fs from 'fs';
import os from 'os';
import path from 'path';
import TextInput from '../../component/textinput/textinput';
import Button from '../../component/button/button';
import InputHolder from '../../component/inputholder/inputholder';
import Global from '../../util/global';
import SettingsManager from '../../manager/settingsManager';
import LibrariesManager from '../../manager/librariesManager';
import logo from '../../img/logo-sm.png';
import NavContext from '../../navContext';

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
`;

const Logo = styled.div`
  background-image: url(${logo});
  width: 150px;
  height: 150px;
  background-size: contain;
`;

const TI = styled(TextInput)`
  max-width: 680px;
  width: 100%;
`;

const GB = styled(Button)`
  margin-top: 20px;
`;

const IH = styled(InputHolder)`
  margin-top: 1px;
  max-width: 650px;
  width: 100%;
`;

const Spacing = styled.div`
  width: 100%;
  height: 30px;
`;

const AutofillText = styled.p`
  margin: 0;
  font-size: 10pt;
  color: white;
`;

function WelcomePage({ history }) {
  const nav = useContext(NavContext);

  const [mcHome, setMCHome] = useState(Global.getDefaultMinecraftPath());
  const [mcExe, setMCExe] = useState(Global.getDefaultMCExePath());
  const [step, setStep] = useState(0);
  const [preparing, setPreparing] = useState(false);

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

    const mcl = path.join(LibrariesManager.getLibrariesPath(), '/minecraftmanager');
    if (!fs.existsSync(mcl)) {
      fs.mkdirSync(mcl);
    }

    if (!fs.existsSync(LibrariesManager.getMCMLibraries())) {
      fs.mkdirSync(LibrariesManager.getMCMLibraries());
    }

    const result = await Global.updateMCVersions(true);

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
                  <Subtext>the easiest way to manage minecraft mods and modpacks</Subtext>
                </WelcomeBox>
                <GB onClick={nextStep} color="green">
                  Continue
                </GB>
              </>
            )}

            {step === 1 && (
              <>
                <Spacing />
                <Title>Is this where your .minecraft folder is?</Title>

                <IH>
                  <div>
                    <TI disabled value={mcHome} />
                    <Button onClick={chooseHomeDirectory} color="green">
                      change
                    </Button>
                  </div>
                </IH>
                <AutofillText>
                  Most people will not have changed this. However if you have, please update it accordingly.
                </AutofillText>

                <GB onClick={nextStep} color="green">
                  Continue
                </GB>
              </>
            )}

            {step === 2 && (
              <>
                <Spacing />
                <Title>Is this where your Minecraft Executable is?</Title>

                <IH>
                  <div>
                    <TI disabled value={mcExe} />
                    <Button onClick={chooseMCExe} color="green">
                      change
                    </Button>
                  </div>
                </IH>
                <AutofillText>
                  Most people will not have changed this. However if you have, please update it accordingly.
                </AutofillText>

                <GB onClick={nextStep} color="green">
                  Continue
                </GB>
              </>
            )}

            {step === 3 && (
              <>
                <Spacing />
                <Title>You're all set!</Title>

                <Subtext>You're done setting up Minecraft Manager.</Subtext>
                <Subtext>
                  If you need help,{' '}
                  <a href="https://theemeraldtree.net/mcm/wiki">check out the Minecraft Manager wiki.</a>
                </Subtext>

                <GB onClick={start} color="green">
                  Finish Setup
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
  history: PropTypes.object.isRequired
};

export default withRouter(WelcomePage);
