import React, { Component } from 'react';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer';
import Button from '../../../component/button/button';
import styled from 'styled-components';
import TextInput from '../../../component/textinput/textinput';
import TextBox from '../../../component/textbox/textbox';
import Detail from '../../../component/detail/detail';
import InputContainer from '../components/inputcontainer';
const { dialog } = require('electron').remote;
const DescContainer = styled.div`
    margin-top: 40px;
`
const LongDesc = styled(TextBox)`
    height: 400px;
    width: 70%;
    max-width: 500px;
`
const IconWrapper = styled.div`
    width: 80px;
    height: 80px;
    background-color: #717171;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-flow: column;
    position: relative;
    div {
        width: 60px;
        text-align: center;
        position: absolute;
        bottom: 0;
    }
`

const ResetIconButton = styled(Button)`
    width: 57px;
    text-align: center;
`
const Icon = styled.img`
    width: auto;
    height: auto;
    max-width: 80px;
    max-height: 80px;
    flex-shrink: 0;
`;
export default class EditPageGeneral extends Component {
    constructor(props) {
        super(props);
        let profile = ProfilesManager.getProfileFromID(props.match.params.id);
        this.state = {
            profile: profile,
            nameValue: profile.name,
            nameDisabled: true
        }
    }

    static getDerivedStateFromProps(props) {
        let profile = ProfilesManager.getProfileFromID(props.match.params.id);
        return {
            profile: profile,
            iconsrc: profile.iconpath
        }
    }


    
    nameChange = (e) => {
        let newName = e.target.value;
        let namedisable = true;
        if(newName != this.state.profile.name) {
            namedisable = false;
        }
        this.setState({
            nameValue: e.target.value,
            nameDisabled: namedisable
        });
    }

    blurbChange = (e) => {
        this.state.profile.changeBlurb(e.target.value);
    }

    descChange = (e) => {
        this.state.profile.changeDescription(e.target.value);
    }

    changeIcon = () => {
        let p = dialog.showOpenDialog({
            title: 'Select your image file',
            buttonLabel: 'Choose image',
            filters:[{name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif']}],
            properties: ['openFile']
        });

        const img = p[0];
        if(img) {
            this.state.profile.changeIcon(img);
            this.forceUpdate();
            ProfilesManager.updateProfile(this.state.profile);
        }
    }

    resetIcon = () => {
        this.state.profile.resetIcon();
        this.forceUpdate();
        ProfilesManager.updateProfile(this.state.profile);
    }

    render() {
        let { profile, nameValue, nameDisabled } = this.state;
        return (
            <Page>
                <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                <EditContainer profile={profile}>
                    <Detail>profile icon</Detail>
                    <IconWrapper onClick={this.changeIcon}>
                        <Icon src={`${profile.iconpath}#${new Date().getTime()}`} />
                    </IconWrapper>
                    <ResetIconButton onClick={this.resetIcon} color='green'>reset</ResetIconButton>
                    <Detail>profile name</Detail>
                    <InputContainer>
                        <TextInput value={nameValue} onChange={this.nameChange} placeholder="Enter a name" />
                        <Button disabled={nameDisabled} color='green'>change</Button>
                    </InputContainer>
                    <Detail>internal id: {profile.id}</Detail>
                    <Detail>version-safe name: PLACEHOLDER</Detail>

                    <DescContainer>
                        <Detail>short description</Detail>
                        <TextBox defaultValue={profile.blurb} onChange={this.blurbChange} placeholder="Enter a short description" />
                    </DescContainer>

                    <DescContainer>
                        <Detail>long description</Detail>
                        <LongDesc defaultValue={profile.description} onChange={this.descChange} placeholder="Enter a long description" />
                    </DescContainer>
                </EditContainer>
            </Page>
        )   
    }

}