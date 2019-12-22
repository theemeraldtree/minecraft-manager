import React, { Component } from 'react';
import styled from 'styled-components';
import { Redirect } from 'react-router-dom';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer';
import Detail from '../../../component/detail/detail';
import OptionBreak from '../components/optionbreak';
import Button from '../../../component/button/button';
import CustomDropdown from '../../../component/customdropdown/customdropdown';
import Global from '../../../util/global';
import ForgeManager from '../../../manager/forgeManager';
import Overlay from '../../../component/overlay/overlay';
import VersionsManager from '../../../manager/versionsManager';
import Hosts from '../../../host/Hosts';
import FabricManager from '../../../manager/fabricManager';
import AlertManager from '../../../manager/alertManager';
const CustomVersions = styled.div`
    background-color: #2b2b2b;
    width: 350px;
    padding: 10px;
`
const BG = styled.div`
    width: 100%;
    height: fit-content;
    max-width: 600px;
    max-height: 500px;
    background-color: #222;
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
            updateConfirm: false,
            badForgeVersion: false
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

    mcverChange = (version, cancel) => {
        let { profile } = this.state;
        if(!profile.customVersions.forge && !profile.customVersions.fabric) {
            this.setState({
                mcverValue: version
            })
            this.state.profile.changeMCVersion(version);
        }else{
            cancel();
            this.setState({
                newVersion: version
            });
            AlertManager.alert(
                `warning`,
                `changing your minecraft version will remove forge/fabric and all your mods. are you sure you want to change?`,
                this.confirmVersionChange,
                `change`,
                `don't change`
            );
        }
    }

    badForgeVersionClose = () => {
        this.setState({
            badForgeVersion: false
        })
    }

    cancelVersionChange = () => {
        this.setState({
            versionChangeWarning: false
        })
    }

    confirmVersionChange = () => {
        this.state.profile.changeMCVersion(this.state.newVersion);
        this.uninstallForge();
        this.uninstallFabric();
        this.setState({
            versionChangeWarning: false,
            mcverValue: this.state.newVersion
        })
    }

    downloadFabric = () => {
        let { profile } = this.state;
        this.setState({
            fabricIsInstalling: true
        });
        FabricManager.getFabricLoaderVersions(profile.minecraftversion).then(versions => {
            const version = versions[0];
            if(version) {
                profile.setFabricVersion(version.loader.version);
                FabricManager.setupFabric(profile).then(() => {
                    this.setState({
                        fabricIsInstalling: false
                    })
                });
            }else{
                this.setState({
                    fabricIsInstalling: false
                });
                AlertManager.messageBox(
                    `no fabric version`,
                    `there is no fabric version available for minercaft ${profile.minecraftversion}`
                );
            }
        })
    }

    uninstallFabric = () => {
        let { profile } = this.state;
        this.setState({
            fabricIsUninstalling: true
        });
        FabricManager.uninstallFabric(profile).then(() => {
            this.setState({
                fabricIsUninstalling: false
            })
        })
       
    }

    downloadForge = () => {
        let { profile } = this.state;
        if(!VersionsManager.checkIs113OrHigher(profile)) {
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
                        forgeIsInstalling: false
                    })
                    AlertManager.messageBox(
                        `no forge version`,
                        `there is no forge version available for minecraft ${profile.minecraftversion}`
                    );
                }
            })
        }else{
            AlertManager.messageBox(
                `uh oh`,
                `there is currently no suppor for forge in minecraft 1.13+, however it may be implemented in the future
                <br><a href="https://github.com/stairman06/minecraft-manager/wiki/Forge-1.13-">for why, check out this wiki article</a>`
            );
        }

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
            versionToChangeTo: e
        });

        AlertManager.alert(
            `are you sure?`,
            `updating or changing a profile's verison will modify the current files. a backup will be created of the current files. if you've modified files or added mods, you will need to move then over from the backup
            <br>
            <b>the saves folder and options.txt are automatically moved.`,
            this.confirmCurseVerChange,
            'i understand, continue'
        )
    }

    reloadCurseVersionsList = async () => {
        const { profile } = this.state;
        if(profile.hosts) {
            if(profile.hosts.curse) {
                const versions = await Hosts.getVersions('curse', profile);
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
        }).catch(() => {
            this.setState({
                updateConfirm: false,
                updateOverlay: false
            }, () => {
                this.reloadCurseVersionsList();
            })
        })
    }

    render() {
        let { profile, fabricIsInstalling, forgeIsInstalling, forgeIsUninstalling, mcverValue, curseVerValue, hostVersionValues } = this.state;
        if(profile) {
            return (
                <Page>
                    {!this.state.updateOverlay && <Header title='edit profile' backlink={`/profile/${profile.id}`}/>}
                    {this.state.updateOverlay && <Header title='edit profile' backlink={`'/`}/>}
                    <EditContainer profile={profile}>
                        {this.state.updateOverlay && <Overlay>
                            <BG>
                                <Title>{this.state.updateOverlayText}</Title>
                            </BG>
                        </Overlay>}
                        {!profile.hosts.curse && 
                        <>
                            <Detail>minecraft version</Detail>
                            <CustomDropdown onChange={this.mcverChange} items={Global.MC_VERSIONS} value={mcverValue} />
                            <OptionBreak />
                        </>}
                        {profile.hosts.curse && <>
                        <Detail>profile version</Detail>
                        {hostVersionValues && <CustomDropdown value={curseVerValue} onChange={this.curseVersionChange} items={hostVersionValues} />}
                        </>}
    
                        <OptionBreak />
                        <Detail>modloaders</Detail>
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
                        <CustomVersions>
                            <Detail>fabric</Detail>
                            {!profile.customVersions.fabric && !fabricIsInstalling &&
                            <Button onClick={this.downloadFabric} color='green'>install fabric</Button>}
                            {fabricIsInstalling && <p>Fabric is installing. To check progress, open the Downloads viewer in the sidebar</p>}
                            {profile.customVersions.fabric && <>
                            <p>Version: {profile.customVersions.fabric.version}</p>
                            <Button onClick={this.uninstallFabric} color='red'>uninstall fabric</Button>
                            </>}
                        </CustomVersions>
                    </EditContainer>
                </Page>
            )
        }else{
            return (
                <Redirect to='/' />
            )
        }
    }

}