import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button, Spinner } from '@theemeraldtree/emeraldui';
import Overlay from '../overlay/overlay';
import AlertBackground from '../alert/alertbackground';
import HeaderButton from '../headerButton/headerButton';

const Loading = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModeChooser = styled.div`
  margin-top: 5px;
  min-height: 46px;
`;

const Container = styled.div`
  height: 35vh;

  & > p {
    margin: 0;
  }
`;

const ButtonHolder = styled.div`
  position: absolute;
  right: 0;
  bottom: 5px;
  button {
    margin-right: 5px;
  }
`;

const VersionsList = styled.div`
  height: 100%;
  overflow-y: auto;

  &::-webkit-scrollbar-track {
    background: none;
  }
`;

const FrameworkVersion = styled(Button)`
  && {
    width: 100%;
    border: 0;
    color: white;
    background: #121212;
    border-bottom: 1px solid #323232;
    height: 30px;
    position: relative;
    padding-left: 120px;
    text-align: left;
    cursor: pointer;
    padding-top: 0;
    padding-bottom: 0;

    p {
      margin: 0;
      position: absolute;
      left: 10px;
      top: 6px;
      font-weight: 900;
      font-size: 10pt;
    }

    &:hover {
      transform: scale(1.0);
      filter: brightness(1.4);
    }
  }
`;

export default function InstallWizard({ show, name, cancelClick, installClick, versions, getVersions }) {
  const [displayState, setDisplayState] = useState('simple');
  const [allVersions, setAllVersions] = useState([]);

  useEffect(() => {
    if (versions && versions.length) {
      setAllVersions(versions);
    }
  }, [versions]);

  const switchToAdvanced = () => {
    setDisplayState('advanced');
    getVersions();
  };

  const simpleInstallClick = () => {
    installClick('latest');
    cancelClick();
  };

  return (
    <Overlay in={show}>
      <AlertBackground>
        <h1>install {name.toLowerCase()}</h1>
        <ModeChooser>
          <HeaderButton active={displayState === 'simple'} onClick={() => setDisplayState('simple')}>
            Simple Install
          </HeaderButton>
          <HeaderButton active={displayState === 'advanced'} onClick={switchToAdvanced}>
            Advanced Install
          </HeaderButton>
        </ModeChooser>

        <Container>
          {displayState === 'simple' && (
            <>
              <p>The Latest version of {name} will be installed.</p>
              <ButtonHolder>
                <Button onClick={cancelClick} color="red">
                  cancel
                </Button>
                <Button onClick={simpleInstallClick} color="green">
                  install
                </Button>
              </ButtonHolder>
            </>
          )}
          {displayState === 'advanced' && (
            <>
              <p>Choose the version of {name} you want to install</p>
              <VersionsList>
                {
                  allVersions.map(version => (
                    <FrameworkVersion
                      color="#121212"
                      dimHoverEffect
                      key={version.name}
                      onClick={() => {
                        installClick(version.name);
                        cancelClick();
                      }}
                    >
                      <p>{version.status}</p>
                      {version.name}
                    </FrameworkVersion>
                  ))}
                {allVersions.length === 0 && (
                  <Loading>
                    <Spinner />
                  </Loading>
                )}
              </VersionsList>
              <ButtonHolder>
                <Button onClick={cancelClick} color="red">
                  cancel
                </Button>
              </ButtonHolder>
            </>
          )}
        </Container>
      </AlertBackground>
    </Overlay>
  );
}

InstallWizard.propTypes = {
  name: PropTypes.string,
  show: PropTypes.bool,
  cancelClick: PropTypes.func,
  installClick: PropTypes.func,
  getVersions: PropTypes.func,
  versions: PropTypes.array
};
