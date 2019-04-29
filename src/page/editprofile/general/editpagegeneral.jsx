import React, { Component } from 'react';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer';
import Button from '../../../component/button/button';
import styled from 'styled-components';
import TextInput from '../../../component/textinput/textinput';
import TextBox from '../../../component/textbox/textbox';
import Detail from '../components/detail';
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
        this.state = {
            profile: {
                name: 'Loading'
            }
        }
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
                    <Detail>profile name</Detail>
                    <InputContainer>
                        <TextInput placeholder="Enter a name" />
                        <Button color='green'>change</Button>
                    </InputContainer>
                    <Detail>internal id: PLACEHOLDER</Detail>
                    <Detail>version-safe name: PLACEHOLDER</Detail>

                    <DescContainer>
                        <Detail>short description</Detail>
                        <TextBox placeholder="Enter a short description" />
                    </DescContainer>

                    <DescContainer>
                        <Detail>long description</Detail>
                        <LongDesc placeholder="Enter a long description" />
                    </DescContainer>
                </EditContainer>
            </Page>
        )   
    }

}