import React, { Component } from 'react';
import BasicCard from '../basiccard/basiccard';
import { withRouter } from 'react-router-dom';
import Profile from '../../util/profile';
import Buttons from './buttons';
import { BadgeWrapper, TypeBadge, MCVersionBadge, ProfileVersionBadge } from './badges';
class ProfileCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            updateAvailable: false,
            checkingForUpdates: true,
            updateError: false,
            updateTooltip: 'Checking for updates...'
        }
    }
    componentDidMount = () => {
        this.props.profile.checkForUpdates().then((res) => {
            this.setState({
                updateAvailable: res.updateAvailable,
                checkingForUpdates: false,
                updateError: false
            })
            console.log(this.props.profile.name);
            console.log(res.updateAvailable);
            console.log('----');
            if(res.updateAvailable) {
                console.log('UPDATE AVAILAVLE FOR ' + this.props.profile.name);
                this.setState({
                    updateTooltip: 'Update Available',
                })
            }else{
                this.setState({
                    updateTooltip: ''
                })
            }
        }).catch((err) => {
            this.setState({
                updateAvailable: true,
                updateError: true,
                checkingForUpdates: false,
                updateTooltip: 'Error while checking for updates: ' + err
            })
        })
    }
    launch = (e) => {
        e.stopPropagation();
        this.props.profile.launch();
    };
    edit = (e) => {
        e.stopPropagation();
        this.props.history.push(`/profiles/edit/${this.props.profile.id}/settings`);
    };
    render() {
        let history = this.props.history;
        let profile = this.props.profile;
        return (
            <BasicCard onClick={() => {history.push(`/profiles/viewprofile/${profile.id}`)}} img={profile.icon} title={profile.name} desc={profile.desc} cursor={'pointer'} titleWidth={'240px'}>
                <Buttons launch={this.launch} edit={this.edit} />
                <BadgeWrapper>
                    <TypeBadge color='orange'><b>{profile.type.toUpperCase()}</b></TypeBadge>
                    <MCVersionBadge color='green'>MC {profile.mcVersion}</MCVersionBadge>
                    <ProfileVersionBadge showTooltip={this.state.checkingForUpdates || this.state.updateError || this.state.updateAvailable} tooltipAlign='bottom' tooltip={this.state.updateTooltip} color={this.state.checkingForUpdates ? 'purple' : '' || !this.state.checkingForUpdates && this.state.updateAvailable ? 'red' : 'green'}>Profile {profile.version}</ProfileVersionBadge>
                </BadgeWrapper>
            </BasicCard>
        )
    }

}

ProfileCard.propTypes = {
    profile: Profile
}

export default withRouter(ProfileCard);