import React, {Component} from 'react';
import Profile from '../../util/profile';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import ProfileManager from '../../manager/profileManager';
import PageHeader from '../../component/pageheader/pageheader';
import MCVersionSelector from '../../component/mcversionselector/mcversionselector';
import TextInput from '../../component/textinput/textinput';
import TextArea from '../../component/textarea/textarea';
import MinecraftVersionManager from '../../manager/minecraftVersionManager';
import Data from '../../util/data';
import { withRouter } from 'react-router-dom';
import Page, { Main, Content } from '../page';
import styled from 'styled-components';
import Colors from '../../style/colors';
const OptionsWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
`
const Options = styled.div`
    background-color: ${Colors.card};
    width: 50vw;
    padding: 10px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    flex-flow: column;
    position: relative;
`
const Title = styled.p`
    color: white;
    text-align: center;
    font-weight: bolder;
    font-size: 23pt;
`
const Error = styled.p`
    color: red;
    position: absolute;
    text-align: center;
    top: 80px;
    font-weight: bolder;
`
const DropdownLabel = styled.p`
    color: white;
    margin: 0;
    margin-top: 20px;
    font-weight: bolder;
    font-size: 12pt;
`
const CreateButton = styled.div`
    background-color: ${Colors.add};
    margin-top: 20px;
    width: 200px;
    height: 100px;
    text-align: center;
    color: white;
    font-size: 20pt;
    font-weight: bold;
    border-radius: 13px;
    line-height: 100px;
    cursor: pointer;
    transition: 150ms;
    &:hover {
        transition: 150ms;
        filter: brightness(40%);
    }
`
class CreateProfilePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: new Profile(),
            loading: true,
            version: MinecraftVersionManager.getVersions()[0],
            error: 'You must provide a profile name!'
        }
    }
    nameChange = (e) => {

        let name = e.target.value;
        this.setState({
            name: name
        })
        if(name === '') {
            this.setState({
                error: 'You must provide a profile name!'
            });
            return;
        }else if(name.length >= 50) {
            this.setState({
                error: 'Your profile name is too long (50 characters)!'
            })
        }else if(ProfileManager.getProfileFromId(Data.createId(name))) {
            this.setState({
                error: 'A profile already exists with that name!'
            })
        }else{
            this.setState({
                error: ''
            })
        }

        
    }
    descChange = (e) => {
        this.setState({
            desc: e.target.value
        })
    }
    versionChange = (e) => {
        this.setState({
            version: e.target.value
        })
    } 
    
    createProfile = () => {
        if(this.state.error === '') {
            let profile = new Profile(Data.createId(this.state.name));
            profile.name = this.state.name;
            profile.versionname = Data.createVersionName(this.state.name);
            profile.desc = this.state.desc;
            profile.mcVersion = this.state.version;
            profile.epochDate = (new Date()).getTime();
            ProfileManager.createProfile(profile);
            this.props.history.push(`/profiles/viewprofile/${Data.createId(this.state.name)}`);
        }

    }
    
    render() {
        return (
            <Page>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader showBackButton title='Create Profile' />
                        <OptionsWrapper>
                            <Options>
                                <Title>Create a Profile</Title>
                                
                                <Error>{this.state.error}</Error>
                                <TextInput onChange={this.nameChange} label='PROFILE NAME' />
                                <TextArea onChange={this.descChange} label='DESCRIPTION' />
                                <DropdownLabel>MINECRAFT VERSION</DropdownLabel>
                                <MCVersionSelector onChange={this.versionChange} />

                                <CreateButton onClick={this.createProfile}>Create</CreateButton>
                            </Options>
                        </OptionsWrapper>
                    </Content>
                </Main>
            </Page>
        )

    }
}

export default withRouter(CreateProfilePage);