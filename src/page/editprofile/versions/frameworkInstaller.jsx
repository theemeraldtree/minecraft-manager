import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Overlay from '../../../component/overlay/overlay';
import AlertBackground from '../../../component/alert/alertbackground';
import HeaderButton from '../../../component/headerButton/headerButton';
import Button from '../../../component/button/button';
import ForgeFramework from '../../../framework/forge/forgeFramework';
import FabricFramework from '../../../framework/fabric/fabricFramework';

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

const FrameworkVersion = styled.button`
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

  p {
    margin: 0;
    position: absolute;
    left: 10px;
    top: 6px;
    font-weight: 900;
  }

  &:hover {
    filter: brightness(0.75);
  }
`;

export default function FrameworkInstaller({ show, profile, framework, cancelClick, installClick }) {
  const [displayState, setDisplayState] = useState('simple');
  const [allVersions, setAllVersions] = useState([]);
  const [noVersions, setNoVersions] = useState(false);

  const humanName = fr => {
    if (fr === 'forge') return 'Minecraft Forge';
    if (fr === 'fabric') return 'Fabric';

    return '';
  };

  const switchToAdvanced = async () => {
    setDisplayState('advanced');
    if (allVersions.length === 0) {
      if (framework === 'forge') {
        const versions = await ForgeFramework.getForgeVersions(profile.version.minecraft.version);
        const promos = await ForgeFramework.getForgePromotions();
        if (versions) {
          setAllVersions(
            versions
              .map(ver => {
                const promoRecommended = promos.promos[`${profile.version.minecraft.version}-recommended`];
                const promoLatest = promos.promos[`${profile.version.minecraft.version}-latest`];

                if (promoRecommended && `${profile.version.minecraft.version}-${promoRecommended.version}` === ver) {
                  return {
                    status: 'Recommended',
                    name: ver
                  };
                }

                if (promoLatest && `${profile.version.minecraft.version}-${promoLatest.version}` === ver) {
                  return {
                    status: 'Latest',
                    name: ver
                  };
                }

                return {
                  name: ver
                };
              })
              .reverse()
          );
        } else {
          setNoVersions(true);
        }
      } else if (framework === 'fabric') {
        const versions = await FabricFramework.getFabricLoaderVersions(profile.version.minecraft.version);
        if (versions) {
          setAllVersions(
            versions.map(ver => ({
              name: ver.loader.version
            }))
          );
        } else {
          setNoVersions(true);
        }
      }
    }
  };

  const simpleInstallClick = () => {
    installClick('latest');
    cancelClick();
  };

  return (
    <Overlay in={show}>
      <AlertBackground>
        <h1>install {humanName(framework).toLowerCase()}</h1>
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
              <p>The Latest version of {humanName(framework)} will be installed.</p>
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
              <p>Choose the version of {humanName(framework)} you want to install</p>
              <VersionsList>
                {!noVersions &&
                  allVersions.map(version => (
                    <FrameworkVersion
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
                {noVersions && (
                  <>
                    <p>
                      Unfortunately there are no {humanName(framework)} versions compatible with{' '}
                      {profile.version.minecraft.version}
                    </p>
                  </>
                )}
                {allVersions.length === 0 && (
                  <>
                    <p>loading...</p>
                  </>
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

FrameworkInstaller.propTypes = {
  framework: PropTypes.string,
  profile: PropTypes.object,
  cancelClick: PropTypes.func,
  installClick: PropTypes.func,
  show: PropTypes.bool
};
