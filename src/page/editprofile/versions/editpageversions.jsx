import React, { Component } from 'react';
import styled from 'styled-components';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer';
import Detail from '../../../component/detail/detail';
import OptionBreak from '../components/optionbreak';
import InputContainer from '../components/inputcontainer';
import Button from '../../../component/button/button';
import CustomDropdown from '../../../component/customdropdown/customdropdown';
import Global from '../../../util/global';
import ForgeManager from '../../../manager/forgeManager';
import Confirmation from '../../../component/confirmation/confirmation';
import Curse from '../../../host/curse/curse';
import Overlay from '../../../component/overlay/overlay';
const CustomVersions = styled.div`
    background-color: #505050;
    width: 350px;
    padding: 10px;
`
const BG = styled.div`
    width: 100%;
    height: fit-content;
    max-width: 600px;
    max-height: 500px;
    background-color: #444444;
    padding: 10px;
    color: white;
    display: flex;
    flex-flow: column;
`
const Title = styled.p`
    margin: 0;
    font-weight: 200;
    font-size: 21pt;
`
export default class EditPageVersions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: {
                name: 'Loading'
            },
            mcverValue: '',
            curseVerValue: '',
            updateOverlay: false,
            updateOverlayText: 'Getting things ready...',
            updateConfirm: false
        }
    }

    static getDerivedStateFromProps(props) {
        return {
            profile: ProfilesManager.getProfileFromID(props.match.params.id)
        }
    }
    
    async componentDidMount() {
        this.setState({
            mcverValue: this.state.profile.minecraftversion
        });

        this.reloadCurseVersionsList();
    }

    mcverChange = (version, e) => {
        let { profile } = this.state;
        if(!profile.customVersions.forge) {
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
            let verObj = obj.promos[`${profile.minecraftversion}-latest`];
            if(verObj) {
                let version = `${profile.minecraftversion}-${verObj.version}`;
                profile.setForgeVersion(version);
                ForgeManager.setupForge(profile).then(() => {
                    this.setState({
                        forgeIsInstalling: false
                    })
                });
            }else{
                this.setState({
                    forgeIsInstalling: false,
                    noForgeVerAvailable: true
                })
            }

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

    curseVersionChange = (e) => {
        this.setState({
            versionToChangeTo: e,
            updateConfirm: true
        })
    }

    reloadCurseVersionsList = async () => {
        const { profile } = this.state;
        if(profile.hosts) {
            if(profile.hosts.curse) {
                const versions = await Curse.getVersionsFromAsset(profile);
                let nameArray = [];
                versions[0].latest = true;
                for(let ver of versions) {
                    let name = ver.displayName;
                    if(ver.latest) {
                        name += ' (latest)';
                    }
                    if(profile.version.displayName === ver.displayName) {
                        name += ' (current)';
                    }

                    nameArray.push({
                        id: ver.hosts.curse.fileID,
                        name: name
                    })
                }

                this.setState({
                    hostVersionValues: nameArray,
                    curseVerValue: profile.version.hosts.curse.fileID
                })
            }
        }
    }

    confirmCurseVerChange = async () => {
        const{ profile, versionToChangeTo } = this.state;
        this.setState({
            updateConfirm: false,
            updateOverlay: true
        })
        profile.changeCurseVersion(versionToChangeTo, (updtext) => {
            this.setState({
                updateOverlayText: updtext
            })
        }).then((newprofile) => {
            this.setState({
                profile: newprofile,
                updateConfirm: false,
                updateOverlay: false
            }, () => {
                this.reloadCurseVersionsList();
            });
        })
    }

    cancelCurseVerChange = () => {
        this.setState({
            updateConfirm: false
        })
    }

    closeNoForgeVer = () => {
        this.setState({
            noForgeVerAvailable: false
        })
    }

    render() {
        let { profile, forgeIsInstalling, forgeIsUninstalling, mcverValue, curseVerValue, hostVersionValues } = this.state;
        return (
            <Page>
                {this.state.updateConfirm && <Overlay>
                    <BG>
                        <Title>are you sure?</Title>
                        <p>Updating or changing a profile's version will modify the current files. A backup will be created of the current files. If you've modified files or added mods, you will need to move them over from the backup. <b>The saves folder and options.txt are automatically moved.</b></p>
                        
                        <InputContainer>
                            <Button onClick={this.cancelCurseVerChange} color='red'>cancel</Button>
                            <Button onClick={this.confirmCurseVerChange} color='green'>I understand, continue</Button>
                        </InputContainer>
                    </BG>
                </Overlay>}

                {this.state.noForgeVerAvailable && <Overlay>
                    <BG>
                        <Title>no forge version</Title>
                        <p>There is no Forge version available for Minecraft {profile.minecraftversion}</p>
                        <InputContainer>
                            <Button color='green' onClick={this.closeNoForgeVer}>ok</Button>
                        </InputContainer>
                    </BG>
                </Overlay>}

                {!this.state.updateOverlay && <Header title='edit profile' backlink={`/profile/${profile.id}`}/>}
                {this.state.updateOverlay && <Header title='edit profile' backlink={`'/`}/>}
                <EditContainer profile={profile}>
                    {this.state.updateOverlay && <Overlay>
                        <BG>
                            <Title>{this.state.updateOverlayText}</Title>
                        </BG>
                    </Overlay>}
                    <Detail>minecraft version</Detail>
                    <CustomDropdown onChange={this.mcverChange} items={Global.MC_VERSIONS} value={mcverValue} />
                    <OptionBreak />
                    {profile.hosts.curse && <>
                    <Detail>because this is from an online source, you can only choose versions available online</Detail>
                    {hostVersionValues && <CustomDropdown value={curseVerValue} onChange={this.curseVersionChange} items={hostVersionValues} />}
                    </>}

                    <Detail>version timestamp: {profile.version.timestamp}</Detail>
                    <OptionBreak />
                    <Detail>custom versions</Detail>
                    <CustomVersions>
                        <Detail>forge</Detail>
                        {!profile.customVersions.forge && !forgeIsInstalling &&
                        <Button onClick={this.downloadForge} color='green'>install forge</Button>
                        }
                        {forgeIsInstalling && <p>Forge is installing. To check progress, open the Downloads viewer in the sidebar</p>}
                        {forgeIsUninstalling && <p>Forge is being removed. To check progress, open the Downloads viewer in the sidebar</p>}
                        {profile.customVersions.forge && !forgeIsUninstalling && <>
                        <p>Version: {profile.customVersions.forge.version}</p>
                        <Button onClick={this.uninstallForge} color='red'>uninstall forge</Button>
                        </>}
                    </CustomVersions>

                    {this.state.versionChangeWarning && <Confirmation confirmDelete={this.confirmVersionChange} cancelDelete={this.cancelVersionChange} questionText='Changing your Minecraft version will remove Forge and all your mods. Are you sure?' cancelText="Don't change" confirmText='Yes, change it' />}
                </EditContainer>
            </Page>
        )   
    }

}