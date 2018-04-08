import React, {Component} from 'react';
import Profile from '../../util/profile';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import ProfileManager from '../../manager/profileManager';
import PageHeader from '../../component/pageheader/pageheader';
import WideButton from '../../component/button/widebutton/widebutton';
import FunStuff from '../../util/funStuff';
import { withRouter } from 'react-router-dom';
import Loader from '../../component/loader/loader';
import Popup from '../../component/popup/popup';
import FileUtils from '../../util/fileUtils';
import path from 'path';
import MessageBox from '../../component/messagebox/messagebox';
import Page, { Main, Content } from '../page';
import Colors from '../../style/colors';
import styled from 'styled-components';
import Checkbox from '../../component/checkbox/checkbox';
import fs from 'fs';
const { dialog } = require('electron').remote;
const ProfileInfo = styled.div`
    position: relative;
    margin-top: 30px;
    padding-top: 5px;
    padding-left: 5px;
    border-radius: 13px;
    width: 80%;
    margin-left: 70px;
    background: ${Colors.card};
`
const ImgWrapper = styled.div`
    width: 120px;
    height: 120px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
`
const Icon = styled.img`
    width: 100%;
    border-radius: 13px;
    display: inline-block;
`
const Desc = styled.p`
    display: inline-block;
    position: absolute;
    font-size: 13pt;
    overflow: hidden;
    height: 100%;
    margin-left: 5px;
    color: white;
`
const ButtonsWrapper = styled.div`
    padding: 40px 0 0 70px;
    >* {
        margin-top: 5px;
    }
`
const UpdateStatus = styled(MessageBox)`
    margin-top: 10px;
`
const WiderButton = styled(WideButton)`
    width: 350px;
`
const ExportFilesList = styled.div`
    height: 40vh;
    max-height: 500px;
    overflow-y: scroll;
    margin-bottom: 10px;
`
class ViewProfilePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: new Profile(),
            loading: true,
            confirmVisible: false,
            dialogVisible: false,
            updateStatus: '',
            shareVisible: false,
            checkedItems: []
        }
    }
    componentWillMount() {
        ProfileManager.loadProfiles().then(() => {
            let profile = ProfileManager.getProfileFromId(this.props.match.params.id);
            this.setState({
                profile: profile,
                loading: false
            });
        })

    }
    confirmDeleteNo = () => {
        this.setState({
            confirmVisible: false
        })
    }
    confirmDeleteYes = () => {
        this.state.profile.delete().then(() => {
            this.props.history.push('/profiles');
        });
    }
    delete = () => {
        this.setState({
            confirmVisible: true
        })
    }
    update = () => {
        let profile = this.state.profile;
        profile.checkForUpdates().then((res) => {
            console.log(res);
            if(!res.updateAvailable) {
                this.setState({
                    dialogVisible: true,
                    dialogTitle: 'Error',
                    dialogDesc: 'There is no update available!'
                });
            }else{
                console.log('details');
                console.log(res);
                this.setState({
                    updateInfo: res,
                    updateConfirmVisible: true,
                    updateConfirmDesc: `Are you sure you want to update to '${res.verName}'? Any previous changes to the pack will be removed!\n`
                })
                if(profile.isFTB) {
                    this.setState({
                        updateLink: `http://feed-the-beast.com/projects/${profile.curseID}/files/${res.fileID}`
                    })
                }else{
                    this.setState({
                        updateLink: `http://minecraft.curseforge.com/projects/${profile.curseID}/files/${res.fileID}`
                    })
                }
            }
        })
    }
    dialogDismiss = () => {
        this.setState({
            dialogVisible: false
        })
    }
    confirmUpdateNo = () => {
        this.setState({
            updateConfirmVisible: false
        })
    }
    confirmUpdateYes = () => {
        this.setState({
            updateConfirmVisible: false,
            updateStatus: 'Gathering data...'
        }, () => {
            let profile = this.state.profile;
            let updateInfo = this.state.updateInfo;
            this.setState({
                updateStatus: 'Backing up...'
            }, () => {
                profile.backup();
                profile.setProfileVersion(updateInfo, (status) => {
                    this.setState({
                        updateStatus: status
                    })
                }).then(() => {
                    this.setState({
                        loading: false,
                        updateStatus: '',
                        dialogVisible: true,
                        dialogTitle: 'Success',
                        dialogDesc: `Successfully updated to ${updateInfo.verName}!`
                    })
                })
            })
        })

    }

    checkboxChange = (e) => {
        let checked = e.target.checked;
        console.log(e.target.dataset);
        let checkedItems = this.state.checkedItems;
        if(checked) {
            checkedItems[e.target.dataset.label] = checked;
        }else{
            delete checkedItems[e.target.dataset.label];
        }
        this.setState({
            checkedItems: checkedItems
        })
    }

    share = () => {
        fs.readdir(path.join(FileUtils.getAppPath(), `/profiles/${this.state.profile.id}/files/`), (err, files) => {
            let list = [];
            files.forEach((file) => {
                console.log(file);
                if(file !== 'mods') {
                    list.push(<Checkbox label={file} onChange={this.checkboxChange} />)
                }
            })
            this.setState({
                shareVisible: true,
                shareItems: list
            })
        })

    }
    
    closeShareDialog = () => {
        this.setState({
            shareVisible: false
        })
    }

    export = () => {
        this.closeShareDialog();
        let save = dialog.showSaveDialog({title: 'Export profile', buttonLabel: 'Export', filters: [{name: 'Minecraft Java Profile', extensions:['mcjprofile']}]});
        console.log(save);
        if(save) {
            let file = save;
            this.state.profile.exportProfile(file, this.state.checkedItems, (status) => {
                this.setState({
                    updateStatus: status
                })
            }).then(() => {
                this.setState({
                    loading: false,
                    updateStatus: '',
                    dialogVisible: true,
                    dialogTitle: 'Success',
                    dialogDesc: 'Sucessfully exported profile!'
                })
            })
        }
        console.log(this.state.checkedItems);
    }
    render() {
        return (
            <Page>
                <WindowBar />
                <Popup visible={this.state.shareVisible}>
                    <p className='title'>Share the profile</p>
                    <p className='desc'>Select files/folders to share inside the profile. Mods are already included.</p>
                    <ExportFilesList>
                        {this.state.shareItems}
                    </ExportFilesList>

                    <div className='action-buttons'>
                        <WideButton onClick={this.closeShareDialog} type='color-red'>Cancel</WideButton>
                        <WideButton onClick={this.export} type='color-green'>Export</WideButton>
                        <WiderButton disabled type='color-green' showTooltip tooltipAlign='bottom' tooltip='Coming soon'>Export (Twitch)</WiderButton>
                    </div>
                </Popup>
                <Popup visible={this.state.confirmVisible}>
                    <p className='title'>Are you sure?</p>
                    <p className='desc'>Are you sure you want to delete this profile?</p>

                    <div className='action-buttons'>
                        <WideButton onClick={this.confirmDeleteNo} type='color-green'>No!</WideButton>
                        <WideButton onClick={this.confirmDeleteYes} type='delete' showTooltip tooltipAlign='bottom' tooltip={FunStuff.getRandDeleteText()}>Yes!</WideButton>
                    </div>
                </Popup>
                <Popup visible={this.state.dialogVisible}>
                    <p className='title'>{this.state.dialogTitle}</p>
                    <p className='desc'>{this.state.dialogDesc}</p>

                    <div className='action-buttons'>
                        <WideButton onClick={this.dialogDismiss} type='color-green'>Dismiss</WideButton>
                    </div>
                </Popup>
                <Popup visible={this.state.updateConfirmVisible}>
                    <p className='title'>Are you sure?</p>
                    <p className='desc'>{this.state.updateConfirmDesc}</p>

                    <a target='_blank' className='more-info-link' href={this.state.updateLink}>More Info, including changelog</a>

                    <div className='action-buttons'>
                        <WideButton onClick={this.confirmUpdateYes} type='color-green'>Yes</WideButton>
                        <WideButton onClick={this.confirmUpdateNo} type='color-red'>No</WideButton>
                    </div>
                </Popup>
                <Main>
                    <Navbar />
                    {this.state.loading && <PageHeader showSubtitle showBackButton title='Loading...' subtitle={`Loading profile...`} />}
                    <Loader loading={this.state.loading}>
                        <Content>
                            <PageHeader showSubtitle showBackButton title={this.state.profile.name} />
                            <ProfileInfo>
                                <ImgWrapper>
                                    <Icon src={this.state.profile.icon} className='icon' />
                                </ImgWrapper>
                                <Desc>{this.state.profile.desc}</Desc>
                            </ProfileInfo>
                            <ButtonsWrapper>
                                <WideButton onClick={this.state.profile.launch} type='launch'>LAUNCH</WideButton>
                                <WideButton onClick={() => {this.state.profile.edit(this.props.history)}} type='edit'>EDIT</WideButton>
                                <WideButton onClick={this.share} type='share'>SHARE</WideButton>
                                <WideButton onClick={this.delete} type='delete'>DELETE</WideButton>
                                <WideButton onClick={this.update} type='update'>UPDATE</WideButton>

                                {this.state.updateStatus !== '' && <UpdateStatus color='green'>{this.state.updateStatus}</UpdateStatus>}
                            </ButtonsWrapper>
                        </Content>
                    </Loader>
                </Main>
            </Page>
        )

    }
}

export default withRouter(ViewProfilePage);