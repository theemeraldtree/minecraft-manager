import React, { PureComponent } from 'react';
import styled from 'styled-components';
import Button from '../button/button';
import Detail from '../detail/detail';
import SanitizedHTML from '../sanitizedhtml/sanitizedhtml';
import Hosts from '../../host/Hosts';
const BG = styled.div`
  margin-top: 5px;
  width: 100%;
  height: 70px;
  display: flex;
  background-color: #404040;
  flex-flow: column;
  user-select: none;

  ${props =>
    props.hideFramework &&
    `
        height: 55px;
    `}

  ${props =>
    props.extraInfo &&
    `
        height: 310px;
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
  position: absolute;
  top: 17px;
`;

const Details = styled.div`
  display: flex;
  justify-content: center;
  flex-flow: column;
  overflow: hidden;
  flex-shrink: 0;
`;

const MoreInfo = styled.p`
  color: lightblue;
  margin: 0;
  cursor: pointer;
  position: absolute;
  bottom: 0;
  z-index: 2;
`;

const Changelog = styled.div`
  height: 200px;
  overflow-y: scroll;
  width: 100%;
  background-color: #2b2b2b;
`;

const ButtonContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
`;
export default class VersionCard extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showMoreInfo: false,
      changelog: 'loading...',
    };
  }

  toggleMoreInfo = async () => {
    this.setState({
      showMoreInfo: !this.state.showMoreInfo,
    });

    const { version, asset, host } = this.props;
    if (version.hosts.curse) {
      if (this.state.changelog === 'loading...') {
        const changelog = await Hosts.getFileChangelog(
          host,
          asset,
          version.hosts.curse.fileID
        );
        this.setState({
          changelog: changelog,
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
    } = this.props;

    let progress = '';
    if (progressState) {
      if (progressState.version === version.displayName) {
        progress = progressState.progress;
      } else {
        if (
          progressState.progress === 'installed' &&
          !allowVersionReinstallation
        ) {
          progress = 'disable-install';
        } else if (progressState.progress === 'installing') {
          progress = 'disable-install';
        }
      }

      if (badMCVer) {
        progress = 'bad-mc-ver';
      }
    }

    let installed = progress === 'installed';

    const freeToInstall =
      progress !== 'installing' && progress !== 'disable-install';
    return (
      <BG extraInfo={showMoreInfo} hideFramework={hideFramework}>
        <Details>
          <Title>{version.displayName}</Title>
          {version.hosts.curse && !hideFramework && (
            <Modloader>
              framework: {version.hosts.curse.localValues.inferredModloader}
            </Modloader>
          )}
        </Details>
        {!hideButtons && (
          <ButtonContainer>
            {progress === 'bad-mc-ver' && (
              <Button disabled color="green">
                wrong minecraft version
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
              <Button
                data-version={version.cachedID}
                onClick={installClick}
                color="green"
              >
                install
              </Button>
            )}
          </ButtonContainer>
        )}
        {!showMoreInfo && (
          <MoreInfo onClick={this.toggleMoreInfo}>more info</MoreInfo>
        )}
        <InfoSection>
          <Detail>changelog</Detail>
          <Changelog>
            <SanitizedHTML small html={changelog} />
          </Changelog>
          {showMoreInfo && (
            <MoreInfo onClick={this.toggleMoreInfo}>less info</MoreInfo>
          )}
        </InfoSection>
      </BG>
    );
  }
}
