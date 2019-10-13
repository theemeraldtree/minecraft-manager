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
export default class ProfileGrid extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profiles: [],
            showDelete: false
        }
    }

    componentDidMount = () => {
        ProfilesManager.registerReloadListener(this.generateProfiles);
        this.generateProfiles();
    }

    componentWillUnmount = () => {
        ProfilesManager.unregisterReloadListener(this.generateProfiles);
    }
    
    componentDidUpdate = (prevProps) => {
        if(this.props.searchTerm !== prevProps.searchTerm) {
            this.generateProfiles();
        }
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
    generateProfiles = () => {
        let profilesComponents = [];
        for(let profile of ProfilesManager.loadedProfiles) {
            if(!profile.hideFromClient) {
                if(profile.name.toLowerCase().includes(this.props.searchTerm)) {
                    profilesComponents.push(<ProfileCard showUpdate={this.showUpdate} showShare={this.showShare} showDeletion={this.showDeletion} key={profile.id} profile={profile} />);
                }
            }
        }
        this.setState({
            profiles: profilesComponents
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
            this.generateProfiles();
            this.setState({
                showDelete: false
            })
        })
    }

    render() {
        return (
            <BG>
                {this.state.showShare && <ShareOverlay profile={this.state.activeProfile} cancelClick={this.cancelShare} />}
                {this.state.showUpdate && <UpdateOverlay profile={this.state.activeProfile} cancelClick={this.cancelUpdate} />}
                {this.state.showDelete && 
                    <Confirmation cancelDelete={this.cancelDelete} confirmDelete={this.confirmDelete} />
                }
                {this.state.profiles}
            </BG>
        )
    }
}