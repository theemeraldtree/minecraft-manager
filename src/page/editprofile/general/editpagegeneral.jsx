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
const DescContainer = styled.div`
    margin-top: 40px;
`
const LongDesc = styled(TextBox)`
    height: 400px;
    width: 70%;
    max-width: 500px;
`
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
            profile: profile
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

    render() {
        let { profile, nameValue, nameDisabled } = this.state;
        return (
            <Page>
                <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                <EditContainer profile={profile}>
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