import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button } from '@theemeraldtree/emeraldui';
import Overlay from '../overlay/overlay';
import Hosts from '../../host/Hosts';
import AlertBackground from '../alert/alertbackground';
import Global from '../../util/global';

const BG = styled(AlertBackground)`
  width: 100%;
  height: fit-content;
  max-width: 600px;
  max-height: 500px;
  background-color: #222;
  padding: 10px;
  color: white;
  display: flex;
  flex-flow: column;
`;

const Title = styled.p`
  margin: 0;
  font-weight: 200;
  font-size: 21pt;
`;

const Subtext = styled.p`
  margin: 0;
`;

const Breaker = styled.div`
  height: 29px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
  flex-shrink: 0;
  button {
    margin-right: 5px;
  }
`;

export default class UpdateOverlay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayState: 'main',
      noConnection: false
    };
  }

  componentDidUpdate(prevProps) {
    if ((prevProps.profile !== this.props.profile && this.props.profile !== undefined) || (this.props.show !== prevProps.show)) {
      this.useProfile();
    }
  }

  enableFolder = e => {
    const { exportFolders } = this.state;
    exportFolders[e.currentTarget.dataset.folder] = !exportFolders[e.currentTarget.dataset.folder];
    this.setState({
      exportFolders
    });
  };

  updateClick = () => {
    const { profile } = this.props;
    const { updateVersion } = this.state;
    this.setState({
      displayState: 'progress'
    });
    profile
      .changeHostVersion('curse', updateVersion.hosts.curse.fileID, progress => {
        this.setState({
          updateProgress: progress
        });
      })
      .then(() => {
        this.setState({
          displayState: 'done'
        });
      });
  };

  async useProfile() {
    const { profile } = this.props;
    if (profile.hosts.curse) {
      const update = await Hosts.checkForAssetUpdates('curse', profile);
      if (update) {
        if (update === 'no-connection') {
          this.setState({
            noConnection: true,
            updateAvailable: false
          });
        } else {
          this.setState({
            updateAvailable: true,
            updateVersion: update
          });
        }
      } else {
        this.setState({
          noUpdates: true
        });
      }
    } else {
      this.setState({
        noUpdates: true
      });
    }
  }

  render() {
    const { noUpdates, updateAvailable, updateVersion, displayState, noConnection, updateProgress } = this.state;

    const { profile, cancelClick, show } = this.props;

    let isHosted = false;
    if (profile && profile.hosts) {
      if (profile.hosts.curse) {
        isHosted = true;
      }
    }
    return (
      <Overlay force in={show}>
        <BG>
          {displayState === 'done' && (
            <>
              <Title>Done</Title>
              <Subtext>The instance update is complete</Subtext>
              <ButtonsContainer>
                <Button onClick={cancelClick} color="green">
                  Done
                </Button>
              </ButtonsContainer>
            </>
          )}
          {displayState === 'main' && isHosted && (
            <>
              {displayState !== 'done' && <Title>Update your instance</Title>}
              {!noUpdates && !updateAvailable && !noConnection && <Subtext>Checking for updates...</Subtext>}
              {noUpdates && !noConnection && <Subtext>You have the latest version. No update is available</Subtext>}
              {noConnection && <Subtext>Unable to check for updates. Check your internet connection, and try again.</Subtext>}
              {updateAvailable && (
                <Subtext>
                  A new version is available.
                  <br />
                  You have: {Global.cleanVersionName(profile.version.displayName)}
                  <br />
                  Latest version: {Global.cleanVersionName(updateVersion.displayName)}
                  <br />
                  Would you like to update?
                </Subtext>
              )}
              <Breaker />
              <ButtonsContainer>
                {updateAvailable && (
                  <>
                    <Button onClick={cancelClick} color="red">
                      Cancel
                    </Button>
                    <Button onClick={this.updateClick} color="green">
                      Update
                    </Button>
                  </>
                )}
                {(noUpdates || noConnection) && (
                  <Button color="green" onClick={cancelClick}>
                    Done
                  </Button>
                )}
              </ButtonsContainer>
            </>
          )}
          {!isHosted && (
            <>
              <Title>Cannot update</Title>
              <Subtext>This instance was not downloaded from Discover. It cannot be updated.</Subtext>
              <ButtonsContainer>
                <Button color="#444" onClick={cancelClick}>
                  Done
                </Button>
              </ButtonsContainer>
            </>
          )}
          {displayState === 'progress' && (
            <>
              <Title>Updating...</Title>
              <Subtext>{updateProgress}</Subtext>
              <Subtext>To check progress, open the Downloads viewer.</Subtext>
            </>
          )}
        </BG>
      </Overlay>
    );
  }
}

UpdateOverlay.propTypes = {
  profile: PropTypes.object,
  cancelClick: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired
};
