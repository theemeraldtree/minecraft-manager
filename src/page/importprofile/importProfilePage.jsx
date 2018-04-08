import React, { Component } from 'react';
import FileUtils from '../../util/fileUtils';
import Page, { Main, Content } from '../page';
import Navbar from '../../component/navbar/navbar';
import { Redirect } from 'react-router-dom';
import WindowBar from '../../component/windowBar/windowBar';
import styled from 'styled-components';
import WideButton from '../../component/button/widebutton/widebutton';
import fs from 'fs';
import MessageBox from '../../component/messagebox/messagebox';
import ProfileManager from '../../manager/profileManager';
import Popup from '../../component/popup/popup';
import PageHeader from '../../component/pageheader/pageheader';
import { OpenedFiles } from '../../app';
const { dialog } = require('electron').remote;
const app = require('electron').remote;
const Import = styled.div`
    margin: 10px;
`
const ImportButton = styled(WideButton)`
    margin: 10px;
    width: 270px;
`
export default class ImportProfilePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            status: '',
            loading: false,
            dialogVisible: false,
            dialogTitle: '',
            dialogDesc: '',
            confirmVisible: false,
            importLocation: ''
        }
    }
    componentWillMount = () => {
        let argv1 = app.process.argv[1];
        if(argv1 && argv1 !== '--noDevServer' && argv1 !== '' && argv1 !== '.' && argv1 !== '--updated' && !OpenedFiles.includes(argv1)) {
            OpenedFiles.push(argv1);
            this.setState({
                confirmVisible: true,
                importLocation: argv1
            })
        }
    }
    importFile = (file) => {
        this.setState({
            loading: true,
            confirmVisible: false
        }, () => {
            ProfileManager.importProfile(file, (status) => {
                this.setState({
                    status: status
                })
            }).then(() => {
                this.setState({
                    loading: false,
                    dialogVisible: true,
                    dialogTitle: 'Success',
                    dialogDesc: 'Successfully imported the profile!'
                })
            }).catch((err) => {
                console.log('err' + err);
                if(err === 'already-exists') {
                    this.setState({
                        loading: false,
                        dialogVisible: true,
                        dialogTitle: 'Error',
                        dialogDesc: 'There is already a profile with that name!'
                    })
                }
            })
        })
    }
    chooseFile = () => {
        let loc = dialog.showOpenDialog({title: 'Choose a profile to import', buttonLabel: 'Import', filters: [{name: 'Minecraft Java Profile', extensions: ['mcjprofile']}]});
        if(loc[0]) {
            if(fs.existsSync(loc[0])) {
                this.importFile(loc[0]);
            }
        }
    }
    closeDialog = () => {
        this.setState({
            dialogVisible: false
        })
    }
    cancelImport = () => {
        this.setState({
            importLocation: '',
            confirmVisible: false
        })
    }
    confirmImport = () => {
        this.importFile(this.state.importLocation);
    }
    render() {
        return (
            <Page>
                {!FileUtils.isSetup() && <Redirect to='/welcome' />}
                <Popup visible={this.state.confirmVisible}>
                    <p className='title'>Confirmation</p>
                    <p className='desc'>Do you want to import '{this.state.importLocation}'?</p>
                    <div className='action-buttons'>
                        <WideButton type='color-red' onClick={this.cancelImport}>No</WideButton>
                        <WideButton type='color-green' onClick={this.confirmImport}>Yes</WideButton>
                    </div>
                </Popup>
                <Popup visible={this.state.dialogVisible}>
                    <p className='title'>{this.state.dialogTitle}</p>
                    <p className='desc'>{this.state.dialogDesc}</p>
                    <div className='action-buttons'>
                        <WideButton onClick={this.closeDialog} type='color-green'>OK</WideButton>
                    </div>
                </Popup>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader title='Import a Profile' backURL='/profiles' />
                        <Import>
                            {!this.state.loading && <ImportButton onClick={this.chooseFile} type='file'>Choose file</ImportButton>}
                            {this.state.loading && <MessageBox color='green'>{this.state.status}</MessageBox>}
                        </Import>
                    </Content>
                </Main>
            </Page>
        )
    }
}