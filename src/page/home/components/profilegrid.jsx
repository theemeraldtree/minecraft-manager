import React, { Component } from 'react';
import ProfilesManager from '../../../manager/profilesManager';
import ProfileCard from '../../../component/profilecard/profilecard';
import styled from 'styled-components';
import Confirmation from '../../../component/confirmation/confirmation';
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
        this.generateProfiles();
    }

    componentDidUpdate = (prevProps) => {
        if(this.props !== prevProps) {
            this.generateProfiles();
        }
    }

    generateProfiles = () => {
        let profilesComponents = [];
        for(let profile of ProfilesManager.loadedProfiles) {
            if(profile.name.toLowerCase().includes(this.props.searchTerm)) {
                profilesComponents.push(<ProfileCard showDeletion={this.showDeletion} key={profile.id} profile={profile} />);
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
                {this.state.showDelete && 
                    <Confirmation cancelDelete={this.cancelDelete} confirmDelete={this.confirmDelete} />
                }
                {this.state.profiles}
            </BG>
        )
    }
}