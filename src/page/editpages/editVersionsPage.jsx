import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import Popup from '../../component/popup/popup';
import ForgeVersionSelector from '../../component/forgeversionselector/forgeversionselector';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import ProfileManager from '../../manager/profileManager';
import PageHeader from '../../component/pageheader/pageheader';
import MCVersionSelector from '../../component/mcversionselector/mcversionselector';
import Dropdown from '../../component/dropdown/dropdown';
import CurseManager from '../../manager/curseManager';
import Profile from '../../util/profile';
import Loader from '../../component/loader/loader';
import TextInput from '../../component/textinput/textinput';
import WideButton from '../../component/button/widebutton/widebutton';
import EditBar from './component/editbar';
import Page, { Main, Content } from '../page';
import EditContainer from './component/editcontainer';
import EditOptions from './component/editoptions';
import IconButton from '../../component/button/iconbutton/iconbutton';
import styled from 'styled-components';
import Colors from '../../style/colors';
const Label = styled.p`
    color: white;
    margin: 0;
    font-weight: bolder;
    font-size: 12pt;
    margin-top: 10px;
`
const VersionCard = styled.div`
    background-color: ${Colors.card};
    border-radius: 13px;
    padding-left: 10px;
    padding-top: 10px;
    margin-top: 30px;
    padding-bottom: 10px;
    margin-right: 20px;
`
const VersionTitle = styled.p`
    color: white;
    margin: 0;
    font-weight: bolder;
    font-size: 20pt;
`
const WideDropdown = styled(Dropdown)`
    width: 40%;
`
const Status = styled.p`
    color: white;
    margin: 0;
    font-weight: bolder;
    font-size: 20pt;
`
const VersionChangeButton = styled(IconButton)`
    position: absolute;
    right: -70px;
    top: 24px;
`
class EditVersionsPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: new Profile(),
            loading: true,
            profileVersionError: '',
            profileVersionChange: '',
            processing: false,
            forgeVersion: 'None',
            processingText: 'Error',
            epochDate: 0,
            curseVersions: [],
            versionBinds: {},
            versionChanging: false,
            versionChangeStatus: '',
            allowProfileVersionChange: false
        }
    }
    searchChange = (e) => {
        this.setState({
            searchTerm: e.target.value
        })
    }
    componentWillMount() {
        ProfileManager.loadProfiles().then(() => {
            let profile = ProfileManager.getProfileFromId(this.props.match.params.id);
            this.setState({
                profile: profile,
                packVersion: profile.curseFileID,
                mcVersion: profile.mcVersion,
                loading: false,
                forgeVersion: profile.forgeVersion,
                rawForge: profile.rawForge,
                epochDate: profile.epochDate,
                profileVersionChange: profile.version,
            }, () => {
                if(profile.type === 'curse') {
                    this.getCurseVersions();
                }
            });

        })

    }
    getCurseVersions = () => {
        CurseManager.getPackFiles(this.state.profile, this.state.mcVersion).then((packfiles) => {
            console.log(packfiles);
            let list = [];
            let versionBinds = {};
            for(let item of packfiles) {
                list.push({value: item.fileID, name: item.name});
                versionBinds[item.fileID] = item.name;
            }
            console.log(list);
            this.setState({
                packfiles: list,
                versionBinds: versionBinds,
                packversion: this.state.profile.curseFileId
            })
        })
    }
    isForgeInstalled() {
        if(this.state.profile.forgeMCVer == this.state.profile.mcVersion) {
            return true;
        }else{
            return false;
        }
    }
    installForge = (forgeVer, rawForge) => {
        if(rawForge === 'none') {
            this.setState({
                processing: true,
                processingText: 'Uninstalling forge...'
            }, () => {
                this.state.profile.uninstallForge().then(() => {
                    this.setState({
                        processing: false,
                        processingText: '',
                        forgeVersion: 'None',
                        rawForge: 'none'
                    })
                })
            })
        }else{
            this.setState({
                processing: true
            }, () => {
                console.log('installing: ' + forgeVer);
                this.state.profile.rawForge = rawForge;
                this.state.profile.installForgeVersion(forgeVer, (update) => {
                    this.setState({
                        processingText: update
                    })
                }).then(() => {
                    this.setState({
                        processing: false,
                        processingText: '',
                        forgeVersion: rawForge,
                        rawForge: rawForge
                    });
                })
            })
        }

    }
    mcVersionChange = (e) => {
        let mcver = e.target.value;
        this.setState({
            confirmMCVersionVisible: true,
            mcVersionChange: mcver
        })
    }
    confirmMCVersionCancel = () => {
        this.setState({
            mcVersionChange: '',
            confirmMCVersionVisible: false
        })
    }

    confirmMCVersionChange = () => {
        this.state.profile.mcVersion = this.state.mcVersionChange;
        this.state.profile.save();
        this.state.profile.uninstallForge();
        this.setState({
            confirmMCVersionVisible: false,
            forgeVersion: 'None',
            mcVersion: this.state.mcVersionChange
        })
    }

    confirmMCVersionDeleteMods = () => {
        this.state.profile.deleteMods().then(() => {
            this.confirmMCVersionChange();
        })
    }

    forgeVersionChange = (e) => {
        let forgeVer = e.target.value;
        this.installForge(`${this.state.mcVersion}-${forgeVer}`, forgeVer);
    }
    
    profileVersionChange = () => {
        if(this.state.allowProfileVersionChange) {
            if(this.state.profileVersionChange === this.state.profile.version) {
                console.log('same version');
                this.setState({
                    profileVersionError: 'That is the same version!'
                })
            }else{
                this.state.profile.version = this.state.profileVersionChange;
                this.state.profile.epochDate = (new Date).getTime();
                this.state.profile.save();
                this.setState({
                    profileVersionError: '',
                    epochDate: this.state.profile.epochDate
                }, () => {
                   
                })
            }
        }
    }
    profileVersionChangeEvent = (e) => {
        let changed = e.target.value;
        if(changed !== this.state.profile.version) {
            if(changed) {
                this.setState({
                    profileVersionChange: e.target.value,
                    allowProfileVersionChange: true
                })
            }else{
                this.setState({
                    allowProfileVersionChange: false
                })
            }
        }else{
            this.setState({
                allowProfileVersionChange: false
            })
        }
    }
    changeCurseVersion = (e) => {
        this.setState({
            packversion: e.target.value
        }, () => {
            console.log(this.state.packversion);
            this.setState({
                versionChanging: true,
                versionChangeStatus: 'Backing up...'
            }, () => {
                this.state.profile.backup();
                this.state.profile.setProfileVersion({fileID: this.state.packversion}, (update) => {
                    this.setState({
                        versionChanging: true,
                        versionChangeStatus: update
                    })
                }).then(() => {
                    this.setState({
                        versionChanging: false
                    })
                    setTimeout(() => {
                        this.props.history.push(`/profiles/edit/${this.state.profile.id}/versions`);
                    }, 2000)
                })
            })

        })
    }
    render() {
        return (
            <Page>
                <WindowBar />
                <Popup visible={this.state.confirmMCVersionVisible}>
                    <p className='title'>Warning</p>
                    <p className='desc'>Changing Minecraft Versions will prevent mods from working! Would you like to delete the existing mods, not delete them, or cancel?</p>

                    <div className='action-buttons'>
                        <WideButton onClick={this.confirmMCVersionCancel} type='color-red'>Cancel</WideButton>
                        <WideButton onClick={this.confirmMCVersionChange} type='color-green'>Don't Delete</WideButton>
                        <WideButton onClick={this.confirmMCVersionDeleteMods} type='color-green'>Delete Mods</WideButton>
                    </div>
                </Popup>
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader backURL={`/profiles/viewprofile/${this.state.profile.id}`} showBackButton title='Edit - Versions' />
                        <EditContainer>
                            <EditBar profile={this.state.profile}/>
                            <Loader loading={this.state.loading}>
                                <EditOptions>
                                    <Label>MINECRAFT VERSION</Label>
                                    <MCVersionSelector onChange={this.mcVersionChange} value={this.state.mcVersion} />

                                    <div className='profile-version'>
                                        <TextInput onChange={this.profileVersionChangeEvent} label='PROFILE VERSION' defaultValue={this.state.profile.version}>
                                            <VersionChangeButton disabled={!this.state.allowProfileVersionChange} type='save' onClick={this.profileVersionChange} showTooltip tooltipAlign='bottom' tooltip='Change Profile Version' />
                                        </TextInput>
                                        <Label>UNIX EPOCH DATE: {this.state.epochDate}</Label>
                                    </div>

                                    <VersionCard>
                                        <VersionTitle>MINECRAFT FORGE</VersionTitle>
                                        {!this.state.processing &&
                                            <div>
                                                <Label>FORGE VERSION</Label>
                                                <ForgeVersionSelector onChange={this.forgeVersionChange} value={this.state.rawForge} mcVersion={this.state.mcVersion} />
                                            </div>
                                        }
                                        {this.state.processing &&
                                            <Status>{this.state.processingText}</Status>
                                        }
                                    </VersionCard>

                                    {this.state.profile.type === 'curse' && 
                                    <VersionCard>
                                        <VersionTitle>CURSEFORGE</VersionTitle>
                                        <div className='packversion'>
                                            {!this.state.versionChanging && <div>
                                                <Label>MODPACK VERSION</Label>
                                                <WideDropdown value={this.state.packVersion} onChange={this.changeCurseVersion} list={this.state.packfiles} />
                                            </div>}
                                            {this.state.versionChanging && <Status>{this.state.versionChangeStatus}</Status>}
                                        </div>
                                    </VersionCard>}
                                </EditOptions>
                            </Loader>
                        </EditContainer>
                    </Content>
                </Main>
            </Page>
        )
    }
}

export default withRouter(EditVersionsPage);