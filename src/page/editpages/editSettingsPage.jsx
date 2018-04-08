import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import ProfileManager from '../../manager/profileManager';
import Data from '../../util/data';
import PageHeader from '../../component/pageheader/pageheader';
import Profile from '../../util/profile';
import Loader from '../../component/loader/loader';
import TextInput from '../../component/textinput/textinput';
import FileUtils from '../../util/fileUtils';
import TextArea from '../../component/textarea/textarea';
import EditBar from './component/editbar';
import styled from 'styled-components';
import Page, { Main, Content } from '../page';
import Colors from '../../style/colors';
import EditOptions from './component/editoptions';
import IconButton from '../../component/button/iconbutton/iconbutton';
import EditContainer from './component/editcontainer';
const { dialog } = require('electron').remote;
const fs = require('fs');
const path = require('path');
const IconChanger = styled.div`
    position: relative;
    margin: 3px;
    margin-top: 20px;
`
const IconWrapper = styled.div`
    width: 100px;
    cursor: pointer;
    border: 3px solid darkgray;
    border-radius: 13px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;
    pading: 9;
`
const Icon = styled.img`
    width: 100%;
    border-radius: 10px;
`
const IconResetButton = styled.div`
    position: absolute;
    top: 0;
    left: 130px;
    background-color: ${Colors.delete};
    border-radius: 5px;
    padding: 5px;
    color: white;
    cursor: pointer;
`
const InternalIDText = styled.p`
    margin: 0;
    margin-top: 5px;
    color: white;
`
const NameError = styled.p`
    color: red;
    margin: 0;
    margin-top: 10px;
    font-weight: bold;
`
const SaveButton = styled(IconButton)`
    display: inline-block;
    position: absolute;
    top: 24px;
    right: -70px;
`
class EditSettingsPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: new Profile(),
            loading: true,
            nameError: '',
            nameVal: '',
            nameTimeout: 0,
            nameIsTyping: false,
            nameChanged: false
        }
    }
    searchChange = (e) => {
        this.setState({
            searchTerm: e.target.value
        })
    }
    componentWillMount() {
        ProfileManager.loadProfiles().then(() => {
            let profile = ProfileManager.getProfileFromId(this.props.match.params.id);
            this.setState({
                profile: profile,
                loading: false
            });
        })

    }
    nameChange = (e) => {
        this.setState({
            nameVal: e.target.value
        })
        // Many invalid names
        let name = e.target.value;
        console.log(name);

        let existingProfile = ProfileManager.getProfileFromId(Data.createId(name));
        if(name.length > 50) {
            this.setState({
                nameError: 'Your name cannot be longer than 50 characters!',
                nameChanged: false
            })
        }else if(!name) {
            this.setState({
                nameError: 'Your profile must have a name!',
                nameChanged: false
            })
        }else if(existingProfile != null && existingProfile != this.state.profile) {
            this.setState({
                nameError: 'A profile with that name already exists!',
                nameChanged: false
            });
        }else if(this.state.profile.name === name) {
            this.setState({
                nameChanged: false
            });
        }else{
            this.setState({
                nameError: '',
                nameChanged: true
            })
        }
    }

    descChange = (e) => {
        this.state.profile.desc = e.target.value;
        this.state.profile.save();
    }
    changeIcon = () => {
        let files = dialog.showOpenDialog({title: 'Set Profile Icon', buttonLabel: 'Set Icon', filters:[{name: 'Images', extensions: ['jpg', 'png']}], properties: ['openFile']});
        let file = files[0];

        if(file != undefined) {
            console.log('thing');
            let iconPath = path.join(FileUtils.getAppPath(), `/profiles/${this.state.profile.id}/icon.png`)
            let stream = fs.createReadStream(file).pipe(fs.createWriteStream(iconPath));
            stream.on('finish', () => {
                // console.log('ting 2');
                this.state.profile.icon = iconPath + `#${new Date().getTime()}`;
                this.state.profile.save();
                    console.log(this.state.profile.icon);
                this.forceUpdate();
            })

        }

    }
    resetIcon = () => {
        if(fs.existsSync(path.join(FileUtils.getAppPath(), `/profiles/${this.state.profile.id}/icon.png`))) {
            fs.unlinkSync(path.join(FileUtils.getAppPath(), `/profiles/${this.state.profile.id}/icon.png`))
        }
        this.state.profile.icon = path.join(FileUtils.getAppPath(), `/resource/mcm-icon.png`);
        this.state.profile.save();
        this.forceUpdate();
    }
    changeName = () => {
        if(this.state.nameError === '' && this.state.nameChanged) {
            this.state.profile.changeName(this.state.nameVal).then(() => {
                this.forceUpdate();
                this.props.history.push(`/profiles/edit/${this.state.profile.id}/settings`);
                this.setState({
                    nameChanged: false
                })
            })
        }
    }
    render() {
        return (
            <Page>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader backURL={`/profiles/viewprofile/${this.state.profile.id}`} showBackButton title='Edit - Settings' />
                        <EditContainer>
                            <EditBar profile={this.state.profile}/>
                            <Loader loading={this.state.loading}>
                                <EditOptions>
                                    <IconChanger>
                                        <IconWrapper onClick={this.changeIcon}>
                                            <Icon src={this.state.profile.icon} />
                                        </IconWrapper>
                                        <IconResetButton onClick={this.resetIcon}>Reset</IconResetButton>
                                    </IconChanger>
                                    <TextInput onChange={this.nameChange} defaultValue={this.state.profile.name} label='PROFILE NAME'>
                                        <SaveButton onClick={this.changeName} disabled={!this.state.nameChanged} type='save' showTooltip tooltipAlign='bottom' tooltip='Save the name' />
                                        <InternalIDText>Internal ID: {this.state.profile.id}</InternalIDText>
                                        <InternalIDText>Version-Safe Name: {this.state.profile.versionname}</InternalIDText>
                                        <NameError>{this.state.nameError}</NameError>
                                    </TextInput>

                                    <TextArea onChange={this.descChange} defaultValue={this.state.profile.desc} size='large' label='DESCRIPTION' />
                                </EditOptions>
                            </Loader>
                        </EditContainer>
                    </Content>
                </Main>
            </Page>
        )
    }
}

export default withRouter(EditSettingsPage);