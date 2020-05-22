import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button, Detail } from '@theemeraldtree/emeraldui';
import SanitizedHTML from '../sanitizedhtml/sanitizedhtml';
import Hosts from '../../host/Hosts';
import Global from '../../util/global';

const BG = styled.div`
  margin-top: 5px;
  width: 100%;
  height: 90px;
  display: flex;
  background-color: #404040;
  flex-flow: column;
  user-select: none;

  ${props =>
    props.hideFramework &&
    `
      height: 70px;
    `}

  ${props =>
    props.extraInfo &&
    `
        height: 345px;
    `}
  
  transition: height 150ms ease;
  position: relative;
  overflow: hidden;
  padding-left: 5px;
`;

const InfoSection = styled.div`
  margin-top: 35px;
  flex: 1 1 auto;
  position: relative;
  padding-bottom: 10px;
  padding-right: 10px;
`;

const Title = styled.p`
  color: white;
  font-weight: bolder;
  font-size: 15pt;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 5px 2px;
  margin-bottom: 0;
  user-select: none;
  display: inline-block;
  white-space: nowrap;
`;

const Modloader = styled.p`
  color: #d9d9d9;
  margin: 0;
`;

const Details = styled.div`
  display: flex;
  justify-content: center;
  flex-flow: column;
  overflow: hidden;
  flex-shrink: 0;
`;

const MoreInfo = styled.button`
  background: none;
  border: 0;
  color: lightblue;
  margin: 0;
  cursor: pointer;
  position: absolute;
  bottom: 0;
  font-size: 12pt;
  padding-left: 3px;
  &:focus-visible {
    outline: 2px solid yellow;
  }
`;

const Changelog = styled.div`
  height: 200px;
  overflow-y: scroll;
  width: 100%;
  background-color: #2b2b2b;
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const ButtonContainer = styled.div`
  position: absolute;
  top: 19px;
  right: 15px;

  button {
    padding: 7px;
    font-size: 11pt;
  }
`;

export default class VersionCard extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showMoreInfo: false,
      changelog: 'loading...'
    };
  }

  toggleMoreInfo = async () => {
    const { showMoreInfo, changelog } = this.state;
    const { version, asset, host } = this.props;

    this.setState({
      showMoreInfo: !showMoreInfo
    });

    if (version.hosts.curse) {
      if (changelog === 'loading...') {
        const newChangelog = await Hosts.getFileChangelog(host, asset, version.hosts.curse.fileID);
        this.setState({
          changelog: newChangelog
        });
      }
    }
  };

  render() {
    const { showMoreInfo, changelog } = this.state;
    const {
      hideButtons,
      hideFramework,
      version,
      badMCVer,
      progressState,
      disableMcVer,
      installClick,
      allowVersionReinstallation,
      asset
    } = this.props;

    let progress = '';
    if (progressState) {
      if (progressState.version === version.displayName) {
        progress = progressState.progress;
      } else if (progressState.progress === 'installed' && !allowVersionReinstallation) {
        progress = 'disable-install';
      } else if (progressState.progress === 'installing') {
        progress = 'disable-install';
      }

      if (badMCVer) {
        progress = 'bad-mc-ver';
      }
    }

    const safeModloader = m => {
      if (m === 'forge') {
        return 'Minecraft Forge';
      }
      if (m === 'fabric') {
        return 'Fabric';
      }

      return '';
    };
    const installed = progress === 'installed';

    const freeToInstall = progress !== 'installing' && progress !== 'disable-install';
    return (
      <BG extraInfo={showMoreInfo} hideFramework={hideFramework}>
        <Details>
          <Title>{Global.cleanVersionName(version.displayName, asset)}</Title>
          {version.hosts.curse && !hideFramework && (
            <Modloader>Modloader: {safeModloader(version.hosts.curse.localValues.inferredModloader)}</Modloader>
          )}
          {version.timestamp && (
            <Modloader>
              Released{' '}
              {new Date(version.timestamp).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Modloader>
          )}
        </Details>
        {!hideButtons && (
          <ButtonContainer>
            {progress === 'bad-mc-ver' && (
              <Button disabled title="minecraft version is incompatible" color="green">
                incompatible
              </Button>
            )}
            {installed && !disableMcVer && progress !== 'disable-install' && (
              <Button disabled color="green">
                installed
              </Button>
            )}
            {progress === 'installing' && (
              <Button disabled color="green">
                installing
              </Button>
            )}
            {progress === 'disable-install' && (
              <Button disabled color="green">
                install
              </Button>
            )}
            {!installed && freeToInstall && progress !== 'bad-mc-ver' && (
              <Button data-version={version.cachedID} onClick={installClick} color="green">
                install
              </Button>
            )}
          </ButtonContainer>
        )}
        {!showMoreInfo && <MoreInfo onClick={this.toggleMoreInfo}>more info</MoreInfo>}
        <InfoSection>
          <Detail>changelog</Detail>
          <Changelog>
            <SanitizedHTML small html={changelog} />
          </Changelog>
          {showMoreInfo && <MoreInfo onClick={this.toggleMoreInfo}>less info</MoreInfo>}
        </InfoSection>
      </BG>
    );
  }
}

VersionCard.propTypes = {
  version: PropTypes.object.isRequired,
  asset: PropTypes.object.isRequired,
  host: PropTypes.string.isRequired,

  hideButtons: PropTypes.bool,
  hideFramework: PropTypes.bool,
  badMCVer: PropTypes.bool,
  progressState: PropTypes.object,
  disableMcVer: PropTypes.bool,
  installClick: PropTypes.func,
  allowVersionReinstallation: PropTypes.bool
};

VersionCard.defaultProps = {
  hideButtons: false,
  hideFramework: false,
  badMCVer: false,
  disableMcVer: false,
  progressState: {},
  installClick: undefined,
  allowVersionReinstallation: false
};
