import React, { Component } from 'react';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer';
import Button from '../../../component/button/button';
import styled from 'styled-components';
import TextInputLabelled from '../../../component/textinputlabelled/textinputlabelled';
import TextBox from '../../../component/textbox/textbox';

const FlexDiv = styled.div`
    display: flex;
    align-items: center;
`
const DescContainer = styled.div`
    margin-top: 40px;
`
const LongDesc = styled(TextBox)`
    height: 400px;
    width: 70%;
    max-width: 500px;
`
const Detail = styled.p`
    margin: 0;
    margin-top: 3px;
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
                    <FlexDiv>
                        <TextInputLabelled title='Profile Name' placeholder="Enter a name" />
                        <Button color='green'>change</Button>
                    </FlexDiv>
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