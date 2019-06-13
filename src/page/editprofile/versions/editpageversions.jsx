import React, { Component } from 'react';
import styled from 'styled-components';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer';
import Detail from '../../../component/detail/detail';
import OptionBreak from '../components/optionbreak';
import InputContainer from '../components/inputcontainer';
import TextInput from '../../../component/textinput/textinput';
import Button from '../../../component/button/button';
import CustomDropdown from '../../../component/customdropdown/customdropdown';
import Global from '../../../util/global';
import ForgeManager from '../../../manager/forgeManager';
const CustomVersions = styled.div`
    background-color: #505050;
    width: 350px;
    padding: 10px;
`
export default class EditPageVersions extends Component {
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
    
    mcverChange = (version) => {
        this.state.profile.changeMCVersion(version);
    }

    downloadForge = () => {
        let { profile } = this.state;
        this.setState({
            forgeIsInstalling: true
        });
        ForgeManager.getForgePromotions().then((promos) => {
            let obj = JSON.parse(promos);
            let version = `${profile.minecraftversion}-${obj.promos[`${profile.minecraftversion}-latest`].version}`;
            profile.setForgeVersion(version);
            ForgeManager.setupForge(profile).then(() => {
                this.setState({
                    forgeIsInstalling: false
                })
            });
        })
    }

    uninstallForge = () => {
        this.setState({
            forgeIsUninstalling: true
        });
        ForgeManager.uninstallForge(this.state.profile).then(() => {
            this.setState({
                forgeIsUninstalling: false
            });
        })
    }
    render() {
        let { profile, forgeIsInstalling, forgeIsUninstalling } = this.state;
        return (
            <Page>
                <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                <EditContainer profile={profile}>
                    <Detail>minecraft version</Detail>
                    <CustomDropdown onChange={this.mcverChange} items={Global.MC_VERSIONS} defaultValue={profile.minecraftversion} />
                    <OptionBreak />
                    <Detail>profile version</Detail>
                    <InputContainer>
                        <TextInput placeholder='Enter a version' />
                        <Button color='green'>change</Button>
                    </InputContainer>
                    <OptionBreak />
                    <Detail>custom versions</Detail>
                    <CustomVersions>
                        <Detail>forge</Detail>
                        {!profile.forgeInstalled && !forgeIsInstalling &&
                        <Button onClick={this.downloadForge} color='green'>install forge</Button>
                        }
                        {forgeIsInstalling && <p>Forge is installing. To check progress, open the Downloads viewer in the sidebar</p>}
                        {forgeIsUninstalling && <p>Forge is being removed. To check progress, open the Downloads viewer in the sidebar</p>}
                        {profile.forgeInstalled && !forgeIsUninstalling && <>
                        <p>Version: {profile.forgeVersion}</p>
                        <Button onClick={this.uninstallForge} color='red'>uninstall forge</Button>
                        </>}
                    </CustomVersions>
                </EditContainer>
            </Page>
        )   
    }

}