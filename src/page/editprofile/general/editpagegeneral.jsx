import React, { useState, useReducer } from 'react';
import { withRouter } from 'react-router-dom';
import ProfilesManager from '../../../manager/profilesManager';
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
    width: calc(100vw - 285px);
    max-width: 770px;
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
    margin-right: 10px;
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

export default withRouter(function EditPageGeneral({ id, history }) {

    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const [ profile ] = useState(ProfilesManager.getProfileFromID(id));
    const [ nameValue, setNameValue ] = useState(profile.name);
    const [ nameDisabled, setNameDisabled ] = useState(true);
    const [ renaming, setRenaming ] = useState(false);


    const nameChange = (e) => {
        let newName = e.target.value;
        let namedisable = true;
        if(newName != profile.name && newName.trim() !== '' && !ProfilesManager.containsProfileWithName(newName)) {
            namedisable = false;
        }
        setNameValue(e.target.value);
        setNameDisabled(namedisable);
    }

    const blurbChange = (e) => {
        profile.blurb = e.target.value;
        profile.save();
    }

    const descChange = (e) => {
        profile.description = e.target.value;
        profile.save();
    }

    const changeIcon = () => {
        let p = dialog.showOpenDialog({
            title: 'Select your image file',
            buttonLabel: 'Choose image',
            filters:[{name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif']}],
            properties: ['openFile']
        });

        if(p && p[0]) {
            const img = p[0];
            profile.setIcon(img);
            ProfilesManager.updateProfile(profile);
            Global.updateCache();
            forceUpdate();
        }
    }

    const confirmNameChange = () => {
        setNameDisabled(true);
        setRenaming(true);
        profile.rename(nameValue).then(profile => {
            history.push(`/edit/general/${profile.id}`);

            // *unfortunately* a page reload is required to my knowledge
            // react-router doesn't want to refresh the page otherwise
            window.location.reload();
        });
    }

    const resetIcon = () => {
        profile.resetIcon();
        ProfilesManager.updateProfile(profile);
        forceUpdate();
    }

    return (
        <>
            { renaming && <>
                <Overlay force>
                    <Renaming>renaming...</Renaming>
                </Overlay> 
            </>}
            { !renaming && <>
                <>
                    <AboutContainer>
                        <div>
                            <Detail>profile icon</Detail>
                            <IconWrapper onClick={changeIcon}>
                                <Icon src={`${profile.iconPath}#${new Date().getTime()}`} />
                            </IconWrapper>
                            <ResetIconButton onClick={resetIcon} color='green'>reset</ResetIconButton>
                        </div>
                        <AboutRight>
                            <div>
                                <Detail>profile name</Detail>
                                <InputContainer>
                                    <TextInput value={nameValue} onChange={nameChange} placeholder="Enter a name" />
                                    <Button onClick={confirmNameChange} disabled={nameDisabled} color='green'>change</Button>
                                </InputContainer>
                            </div>
                            <div>
                                <DescContainer>
                                    <Detail>blurb</Detail>
                                    <TextBox defaultValue={profile.blurb} onChange={blurbChange} placeholder="Enter a short description" />
                                </DescContainer>
                            </div>
                        </AboutRight>
                    </AboutContainer>


                    <DescContainer>
                        <Detail>long description</Detail>
                        <LongDesc defaultValue={profile.description} onChange={descChange} placeholder="Enter a long description" />
                    </DescContainer>
                </>
            </>}
        </>
    )   
})