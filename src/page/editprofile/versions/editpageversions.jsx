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
import Confirmation from '../../../component/confirmation/confirmation';
import Curse from '../../../host/curse/curse';
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
            },
            mcverValue: '',
            hostVersionValues: [
                'Loading'
            ]
        }
    }

    static getDerivedStateFromProps(props) {
        return {
            profile: ProfilesManager.getProfileFromID(props.match.params.id)
        }
    }
    
    componentDidMount() {
        this.setState({
            mcverValue: this.state.profile.minecraftversion
        })
        
        const { profile } = this.state;
        if(profile.hosts) {
            if(profile.hosts.curse) {
                Curse.getVersionsFromItem(profile, 'modpack').then((versions) => {
                    const nameArray = [];
                    versions[0].latest = true;
                    for(let ver of versions) {
                        let name = ver.name;
                        if(ver.latest) {
                            name += ' (latest)';
                        }else if(profile.version === ver.name) {
                            name += ' (current)';
                        }

                        nameArray.push({
                            id: ver.name,
                            name: name
                        })
                    }
                    this.setState({
                        hostVersionValues: nameArray,
                        hostVersions: versions
                    })
                })
            }
        }
    }

    mcverChange = (version, e) => {
        let { profile } = this.state;
        if(!profile.forgeInstalled) {
            this.setState({
                mcverValue: version
            })
            this.state.profile.changeMCVersion(version);
        }else{
            e.stopPropagation();
            this.setState({
                versionChangeWarning: true,
                newVersion: version
            })
        }
    }

    curseVerChange = (version) => {
        let { profile } = this.state;
        Curse.changeProfileVersion(profile, version);
    }

    cancelVersionChange = () => {
        this.setState({
            versionChangeWarning: false
        })
    }

    confirmVersionChange = () => {
        this.state.profile.changeMCVersion(this.state.newVersion);
        this.uninstallForge();
        this.setState({
            versionChangeWarning: false,
            mcverValue: this.state.newVersion
        })
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
        let { profile, forgeIsInstalling, forgeIsUninstalling, mcverValue, hostVersionValues } = this.state;
        return (
            <Page>
                <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                <EditContainer profile={profile}>
                    <Detail>minecraft version</Detail>
                    <CustomDropdown onChange={this.mcverChange} items={Global.MC_VERSIONS} value={mcverValue} />
                    <OptionBreak />
                    <Detail>profile version</Detail>
                    {!profile.hosts.curse && 
                    <InputContainer>
                        <TextInput placeholder='Enter a version' />
                        <Button color='green'>change</Button>
                    </InputContainer>}
                    {profile.hosts.curse && 
                    <div>
                        <CustomDropdown items={hostVersionValues} />
                        <Detail>Because this is a modpack from an online source, you can only change the version to those available online</Detail>
                    </div>}
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

                    {this.state.versionChangeWarning && <Confirmation confirmDelete={this.confirmVersionChange} cancelDelete={this.cancelVersionChange} questionText='Changing your Minecraft version will remove Forge and all your mods. Are you sure?' cancelText="Don't change" confirmText='Yes, change it' />}
                </EditContainer>
            </Page>
        )   
    }

}