import React, { PureComponent } from 'react';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer'; 
import Button from '../../../component/button/button';
import { shell } from 'electron';
import Detail from '../../../component/detail/detail';
export default class EditPageAdvanced extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            profile: {
                name: 'Loading'
            }
        }
    }

    viewProfileFolder = () => {
        let { profile } = this.state;
        shell.openItem(profile.gameDir);
    }

    static getDerivedStateFromProps(props) {
        return {
            profile: ProfilesManager.getProfileFromID(props.match.params.id)
        }
    }
    
    render() {
        let { profile } = this.state;
        return (
            <Page>
                <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                <EditContainer profile={profile}>
                    <Button onClick={this.viewProfileFolder} color='red'>View Profile Folder</Button>
                    <Detail>internal id: {profile.id}</Detail>
                    <Detail>version-safe name: {profile.safename}</Detail>
                    <Detail>version timestamp: {profile.version.timestamp}</Detail>
                </EditContainer>
            </Page>
        )   
    }

}