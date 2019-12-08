import React, { Component } from 'react';
import ProfilesManager from '../../../manager/profilesManager';
import ProfileCard from '../../../component/profilecard/profilecard';
import styled from 'styled-components';
import Confirmation from '../../../component/confirmation/confirmation';
import ShareOverlay from '../../../component/shareoverlay/shareoverlay';
import UpdateOverlay from '../../../component/updateoverlay/updateoverlay';
const BG = styled.div`
    overflow-y: scroll;
    flex: 1 1 auto;
    padding-bottom: 10px;
`
const NoProfileText = styled.p`
    margin: 20px;
    color: white;
    font-size: 21pt;
`
export default class ProfileGrid extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profiles: [],
            showDelete: false
        }
    }

    componentDidMount = () => {
        ProfilesManager.registerReloadListener(this.updateProfiles);
        this.updateProfiles();
    }

    componentWillUnmount = () => {
        ProfilesManager.unregisterReloadListener(this.updateProfiles);
    }

    updateProfiles = () => {
        this.setState({
            profiles: ProfilesManager.loadedProfiles
        })
    }

    showUpdate = (profile) => {
        this.setState({
            showUpdate: true,
            activeProfile: profile
        })
    }

    cancelUpdate = () => {
        this.setState({
            showUpdate: false
        })
    }

    showShare = (profile) => {
        this.setState({
            showShare: true,
            activeProfile: profile
        })
    }

    cancelShare = () => {
        this.setState({
            showShare: false
        })
    }

    showDeletion = (profile) => {
        this.setState({
            showDelete: true,
            deletingProfile: profile
        })
    }

    cancelDelete = () => {
        this.setState({
            showDelete: false
        })
    }

    confirmDelete = () => {
        let { deletingProfile } = this.state;
        ProfilesManager.deleteProfile(deletingProfile).then(() => {
            this.setState({
                showDelete: false
            })
        })
    }

    render() {
        const { showShare, showUpdate, showDelete, activeProfile, profiles } = this.state;
        const { searchTerm } = this.props;
        return (
            <BG>
                {showShare && <ShareOverlay profile={activeProfile} cancelClick={this.cancelShare} />}
                {showUpdate && <UpdateOverlay profile={activeProfile} cancelClick={this.cancelUpdate} />}
                {showDelete && 
                    <Confirmation questionText='are you sure?' cancelDelete={this.cancelDelete} confirmDelete={this.confirmDelete} />
                }
                {
                    profiles.length >= 1 && profiles.map(profile => {
                        if(profile) {
                            if(!profile.hideFromClient && profile.name.toLowerCase().includes(searchTerm)) {
                                return (
                                    <ProfileCard showUpdate={this.showUpdate} showShare={this.showShare} showDeletion={this.showDeletion} key={profile.id} profile={profile} />
                                );
                            }else{
                                return;
                            }
                        }
                    })
                }
                {
                    profiles.length === 0 && <>
                        <NoProfileText>
                            Looks like you have no profiles! Create one using the create button, or download one from the discover tab!
                        </NoProfileText>
                    </>
                }
            </BG>
        )
    }
}