import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';
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
import Global from '../../../util/global';
import Overlay from '../../../component/overlay/overlay';
const { dialog } = require('electron').remote;
const DescContainer = styled.div`
    margin-top: 20px;
    width: 100%;
`

const Renaming = styled.div`
    background-color: #222;
    font-size: 21pt;
    color: white;
`
const LongDesc = styled(TextBox)`
    height: 400px;
    max-width: 780px;
`
const IconWrapper = styled.div`
    width: 150px;
    height: 150px;
    background-color: #404040;
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
    width: 150px;
    padding: 11.5px 0;
    text-align: center;
`
const Icon = styled.img`
    width: auto;
    height: auto;
    max-width: 150px;
    max-height: 150px;
    flex-shrink: 0;
`;

const AboutContainer = styled.div`
    display: flex;
`

const AboutRight = styled.div` 
    overflow-x: hidden;
    margin-left: 20px;

    > div:nth-child(2) {
        margin-top: 10px;
        width: 100vw;
        max-width: 600px;
    }

    textarea {
        width: calc(100vw - 450px);
        max-width: 600px;
        max-height: 107px;
    }

    input {
        width: calc(100vw - 524px);
        max-width: 527px;
    }
`

export default withRouter(class EditPageGeneral extends PureComponent {
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
        if(newName != this.state.profile.name && newName.trim() !== '' && !ProfilesManager.containsProfileWithName(newName)) {
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
            Global.updateCache();
        }
    }

    confirmNameChange = () => {
        const { profile } = this.state;
        this.setState({
            nameDisabled: true,
            renaming: true
        }, () => {
            profile.rename(this.state.nameValue).then(profile => {
                this.props.history.push(`/edit/general/${profile.id}`);

                // *unfortunately* a page reload is required to my knowledge
                // react-router doesn't want to refresh the page otherwise
                window.location.reload();
            });
        });
    }

    resetIcon = () => {
        this.state.profile.resetIcon();
        this.forceUpdate();
        ProfilesManager.updateProfile(this.state.profile);
    }

    render() {
        let { profile, nameValue, nameDisabled, renaming } = this.state;
        return (
            <Page>
                { renaming && <>
                    <Header title='edit profile' backlink='/' />
                    <Overlay force>
                        <Renaming>renaming...</Renaming>
                    </Overlay> 
                </>}
                { !renaming && <>
                    <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                    <EditContainer profile={profile}>
                        <AboutContainer>
                            <div>
                                <Detail>profile icon</Detail>
                                <IconWrapper onClick={this.changeIcon}>
                                    <Icon src={`${profile.iconpath}#${new Date().getTime()}`} />
                                </IconWrapper>
                                <ResetIconButton onClick={this.resetIcon} color='green'>reset</ResetIconButton>
                            </div>
                            <AboutRight>
                                <div>
                                    <Detail>profile name</Detail>
                                    <InputContainer>
                                        <TextInput value={nameValue} onChange={this.nameChange} placeholder="Enter a name" />
                                        <Button onClick={this.confirmNameChange} disabled={nameDisabled} color='green'>change</Button>
                                    </InputContainer>
                                </div>
                                <div>
                                    <DescContainer>
                                        <Detail>blurb</Detail>
                                        <TextBox defaultValue={profile.blurb} onChange={this.blurbChange} placeholder="Enter a short description" />
                                    </DescContainer>
                                </div>
                            </AboutRight>
                        </AboutContainer>


                        <DescContainer>
                            <Detail>long description</Detail>
                            <LongDesc defaultValue={profile.description} onChange={this.descChange} placeholder="Enter a long description" />
                        </DescContainer>
                    </EditContainer>
                </>}
                
            </Page>
        )   
    }

})