import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import path from 'path';
import transition from 'styled-transition-group';
import { withRouter } from 'react-router-dom';
import { Button, Spinner } from '@theemeraldtree/emeraldui';
import mkdirp from 'mkdirp';
import NavContext from '../../navContext';
import logo from '../../img/logo-sm.png';
import JavaHandler from '../../minecraft/javaHandler';
import Global from '../../util/global';
import SettingsManager from '../../manager/settingsManager';
import LatestProfile from '../../defaultProfiles/latestProfile';
import SnapshotProfile from '../../defaultProfiles/snapshotProfile';
import logInit from '../../util/logger';

const Center = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(6px);
  z-index: 9;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column;
  color: white;
`;

const Box = styled.div`
  width: 550px;
  height: 550px;
  background: #292929;
  position: relative;
  overflow: hidden;
  padding: 20px;
`;

const Logo = styled.div`
  background-image: url(${logo});
  width: 150px;
  height: 150px;
  background-size: contain;
`;

const Container = transition.div`
  position: absolute;
  width: 550px;
  height: 550px;
  display: flex;
  justify-content: center;
  align-items: center;
  &:enter {
    margin-left: 1000px;
    opacity: 0;
  }
  &:enter-active {
    margin-left: 0;
    opacity: 1;
    transition: 500ms ease-in-out;
  }
  &:exit {
    margin-left: 0;
    opacity: 1;
  }
  &:exit-active {
    margin-left: -1000px;
    opacity: 0;
    transition: 500ms ease-in-out;
  }
`;

const Pagination = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100vw;
  height: 50px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PageDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 10px;
  background: white;
  margin-right: 5px;
  transition: 500ms;
  ${props => props.active && css`
    background: #45C15A; 
  `}
`;

const WelcomeContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-flow: column;
  h1 {
    margin-bottom: 0;
    font-size: 18pt;
  }
  h2 {
    font-weight: 400;
    font-size: 14pt;
  }
`;

const IssuesLink = styled.div`
  position: absolute;
  bottom: 10px;
`;

const logger = logInit('WelcomePage');

function WelcomePage({ history }) {
  const { header } = useContext(NavContext);
  const [step, setStep] = useState(0);
  const [javaInstalled, setJavaInstalled] = useState(false);
  const [javaError, setJavaError] = useState(false);
  const [settingUp, setSettingUp] = useState(true);
  const [setupError, setSetupError] = useState(false);
  const [errorHappened, setErrorHappened] = useState(false);

  const nextStep = () => setStep(step + 1);

  const installJava = async () => {
    setJavaInstalled(false);
    SettingsManager.createSettings();

    mkdirp.sync(Global.MCM_TEMP);
    mkdirp.sync(path.join(Global.MCM_PATH, '/shared/binaries/java'));

    const version = await JavaHandler.installVersion('latest', path.join(Global.MCM_PATH, '/shared/binaries/java'));

    if (version !== 'error') {
      SettingsManager.currentSettings.java = {
        path: path.join(Global.MCM_PATH, '/shared/binaries/java/', JavaHandler.getDefaultJavaPath()),
        releaseName: version,
        manualPath: ''
      };

      setJavaInstalled(true);
    } else {
      logger.info('Java install errored');
      setStep(1);
      setJavaError(true);
      setJavaInstalled(true);
      setErrorHappened(true);
    }
    setJavaInstalled(true);
  };

  const setup = async () => {
    setSettingUp(true);
    setSetupError(false);

    mkdirp.sync(path.join(Global.MCM_PATH, '/shared/libraries/minecraftmanager/profiles'));
    mkdirp.sync(path.join(Global.MCM_PATH, '/shared/jars'));
    mkdirp.sync(path.join(Global.MCM_PATH, '/shared/assets'));

    SettingsManager.currentSettings.launcherIntegration = false;
    SettingsManager.currentSettings.lastVersion = Global.MCM_VERSION;
    SettingsManager.currentSettings.runLatestInIntegrated = true;

    SettingsManager.save();

    const versions = await Global.updateMCVersions(true);

    setTimeout(async () => {
      if (versions === 'no-connection') {
        setErrorHappened(true);
        setSettingUp(false);
        setSetupError(true);
      } else {
        LatestProfile.version.minecraft.version = Global.MC_VERSIONS[0];
        LatestProfile.minecraftVersion = Global.MC_VERSIONS[0];
        SnapshotProfile.version.minecraft.version = Global.ALL_VERSIONS[0];
        SnapshotProfile.minecraftVersion = Global.ALL_VERSIONS[0];

        LatestProfile.checkMissingMCMValues(true);
        SnapshotProfile.checkMissingMCMValues(true);

        mkdirp.sync(Global.PROFILES_PATH);

        setSettingUp(false);
      }
    }, 1000);
  };


  useEffect(() => {
    if (step === 1) {
      installJava();
    }

    if (step === 2) {
      setup();
    }
  }, [step]);

  useEffect(() => {
    header.setShowBackButton(false);
    header.setTitle('INSTANCES');
    header.setShowChildren(true);
    header.setChildren(
      <>
      </>
    );
  }, []);


  const finish = () => {
    history.push('/');
  };

  return (
    <>
      <Center>
        <Box>

          <Container in={step === 0} timeout={500} unmountOnExit>
            <WelcomeContainer>
              <Logo />
              <h1>Welcome to Minecraft Manager</h1>
              <h2>The easiest way to manage and <br />install mods, modpacks, and more.</h2>
              <Button disabled={step !== 0} onClick={nextStep} color="green">Get Started</Button>
            </WelcomeContainer>
          </Container>

          <Container in={step === 1} timeout={500} unmountOnExit>
            <WelcomeContainer>
              <h1>Java Install</h1>
              {!javaError && <h2>Java is automatically being downloaded and installed.<br />We'll let you know when it's done.</h2>}
              {javaError && <h2>Something went wrong while installing Java.<br />Check your internet connection, and try again.</h2>}
              {!javaInstalled && <Spinner />}
              {(javaInstalled && !javaError) && <Button disabled={step !== 1} onClick={nextStep} color="green">Continue</Button>}
              {(javaError && javaInstalled) && <Button onClick={installJava} color="green">Try Again</Button>}
            </WelcomeContainer>
          </Container>

          <Container in={step === 2} timeout={500} unmountOnExit>
            <WelcomeContainer>
              {!setupError && <h1>All Done!</h1>}
              {setupError && <h1>Uh oh!</h1>}
              {settingUp && <h2>Minecraft Manager is performing<br />some first time setup.</h2>}
              {(!settingUp && !setupError) && <h2>You're all done with setup</h2>}
              {settingUp && <Spinner />}
              {(!settingUp && !setupError) && <Button disabled={step !== 2} onClick={finish} color="green">Finish</Button>}
              {setupError && <h2>Something went wrong during setup.<br />Check your internet connection, and try again.</h2>}
              {setupError && <Button onClick={setup} color="green">Try Again</Button>}
            </WelcomeContainer>
          </Container>
        </Box>

        {errorHappened && (
        <IssuesLink>
          Setup still not working? <a href="https://theemeraldtree.net/mcm/issues">File a bug report</a>
        </IssuesLink>
        )}
        <Pagination>
          <PageDot active={step >= 0} />
          <PageDot active={step >= 1} />
          <PageDot active={step >= 2} />
        </Pagination>
      </Center>
    </>
  );
}

WelcomePage.propTypes = {
  history: PropTypes.object
};

export default withRouter(WelcomePage);
