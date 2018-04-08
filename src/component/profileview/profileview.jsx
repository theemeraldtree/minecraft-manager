import React, { Component } from 'react';
import CardView from '../cardview/cardview';
import ProfileCard from '../profilecard/profilecard';
import PropTypes from 'prop-types';
import ProfileManager from '../../manager/profileManager';
class ProfileView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cards: []
        }
    }
    componentWillReceiveProps(props) {
        // TODO: Remove the kind of hacky fix to styles not updating
        this.setState({
            cards: []
        }, () => {
            let search = props.searchTerm;
            let profiles = ProfileManager.profiles;
            let toShow = profiles.filter(profile => profile.name.toUpperCase().includes(search.toUpperCase()));
    
            let list = [];
            for(let item of toShow) {
                console.log(item);
                list.push(<ProfileCard profile={item} />);
            }
            this.setState({
                cards: list
            }, () => {
                this.forceUpdate();
            });
        })

    }
    componentWillMount() {
        ProfileManager.loadProfiles().then(() => {
            let list = [];
            for(let profile of ProfileManager.profiles) {
                list.push(<ProfileCard profile={profile} />);
            }
            this.setState({
                cards: list
            });
        })
    }

    render() {
        return (
            <CardView>
                {this.state.cards}
            </CardView>
        )
    }

}

ProfileView.propTypes = {
    searchTerm: PropTypes.string
}
export default ProfileView