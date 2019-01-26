import React, { Component } from 'react';
import ProfilesManager from '../../../manager/profilesManager';
import ProfileCard from '../../../component/profilecard/profilecard';
import styled from 'styled-components';
const BG = styled.div`
    overflow-y: scroll;
    flex: 1 1 auto;
    padding-bottom: 10px;
`
export default class ProfileGrid extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profiles: []
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
        console.log("ok");
        let profilesComponents = [];
        for(let profile of ProfilesManager.loadedProfiles) {
            profilesComponents.push(<ProfileCard key={profile.id} profile={profile} />);
        }
        this.setState({
            profiles: profilesComponents
        })
    }
    render() {
        return (
            <BG>
                {this.state.profiles}
            </BG>
        )
    }
}