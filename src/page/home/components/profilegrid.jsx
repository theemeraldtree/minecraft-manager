import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ProfilesManager from '../../../manager/profilesManager';
import ProfileCard from '../../../component/profilecard/profilecard';
import ShareOverlay from '../../../component/shareoverlay/shareoverlay';
import UpdateOverlay from '../../../component/updateoverlay/updateoverlay';
import AlertManager from '../../../manager/alertManager';
import LaunchingOverlay from '../../../component/launchingOverlay/launchingOverlay';

const BG = styled.div`
  overflow-y: auto;
  flex: 1 1 auto;
  padding: 5px;
`;

const NoProfileText = styled.p`
  margin: 20px;
  color: white;
  font-size: 21pt;
`;

export default class ProfileGrid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      profiles: [],
      showLaunchingOverlay: false,
      showUpdate: false,
      showShare: false
    };
  }

  componentDidMount = () => {
    ProfilesManager.registerReloadListener(this.updateProfiles);
    this.updateProfiles();
  };

  componentWillUnmount = () => {
    ProfilesManager.unregisterReloadListener(this.updateProfiles);
  };

  updateProfiles = () => {
    this.setState({
      profiles: ProfilesManager.loadedProfiles
    });
  };

  showUpdate = profile => {
    this.setState({
      showUpdate: true,
      activeProfile: profile
    });
  };

  cancelUpdate = () => {
    this.setState({
      showUpdate: false
    });
  };

  showShare = profile => {
    this.setState({
      showShare: true,
      activeProfile: profile
    });
  };

  cancelShare = () => {
    this.setState({
      showShare: false
    });
  };

  showDeletion = profile => {
    this.setState({
      deletingProfile: profile
    });

    AlertManager.alert('delete instance?', '', this.confirmDelete, 'Delete instance');
  };

  confirmDelete = () => {
    ProfilesManager.deleteProfile(this.state.deletingProfile);
  };

  showLaunching = () => {
    this.setState({
      showLaunchingOverlay: true
    });
  };

  hideLaunching = () => {
    this.setState({
      showLaunchingOverlay: false
    });
  };

  render() {
    const { showShare, showUpdate, activeProfile, profiles, showLaunchingOverlay } = this.state;
    const { searchTerm } = this.props;
    return (
      <BG>
        <LaunchingOverlay show={showLaunchingOverlay} />
        <ShareOverlay show={showShare} profile={activeProfile} cancelClick={this.cancelShare} />
        <UpdateOverlay show={showUpdate} profile={activeProfile} cancelClick={this.cancelUpdate} />
        {profiles.length >= 1 &&
          profiles.map(profile => {
            if (profile) {
              if (!profile.mcm.hideFromClient && profile.name.toLowerCase().includes(searchTerm)) {
                return (
                  <ProfileCard
                    showUpdate={this.showUpdate}
                    showShare={this.showShare}
                    showDeletion={this.showDeletion}
                    showLaunching={this.showLaunching}
                    hideLaunching={this.hideLaunching}
                    key={profile.id}
                    profile={profile}
                  />
                );
              }
            }

            return undefined;
          })}
        {profiles.length === 0 && (
          <>
            <NoProfileText>
              Looks like you have no profiles! Create one using the create button, or download one from the discover
              tab!
            </NoProfileText>
          </>
        )}
      </BG>
    );
  }
}

ProfileGrid.propTypes = {
  searchTerm: PropTypes.string
};
