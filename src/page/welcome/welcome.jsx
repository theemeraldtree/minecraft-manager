import React, { PureComponent } from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import styled from 'styled-components';
import TextInput from '../../component/textinput/textinput';
import Button from '../../component/button/button';
import InputHolder from '../../component/inputholder/inputholder';
import Global from '../../util/global';
import SettingsManager from '../../manager/settingsManager';
import { withRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import LibrariesManager from '../../manager/librariesManager';
import os from 'os';
import logo from '../../img/logo-sm.png';
const { dialog }  = require('electron').remote;
const Title = styled.p`
    color: white;
    font-size: 26pt;
    font-weight: 200;
    margin: 0;
`
const WelcomeBox = styled.div`
    background-color: #404040;
    max-width: 600px;
    padding: 10px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-flow: column;
`
const Subtext = styled.p`
    color: white;
    margin: 0;
`

const Content = styled.div`
    padding: 5px;
    display: flex;
    align-items: center;
    flex-flow: column;
`

const Logo = styled.div`
    background-image: url(${logo});
    width: 150px;
    height: 150px;
    background-size: contain;
`

const TI = styled(TextInput)`
    max-width: 680px;
    width: 100%;
`

const GB = styled(Button)`
    margin-top: 20px;
`

const IH = styled(InputHolder)`
    margin-top: 1px;
    max-width: 650px;
    width: 100%;
`
const Spacing = styled.div`
    width: 100%;
    height: 30px;
`

const AutofillText = styled.p`
    margin: 0;
    font-size: 10pt;
    color: white;
`
export default withRouter(class WelcomePage extends PureComponent {
    constructor() {
        super();
        this.state = {
            mcHome: Global.getDefaultMinecraftPath(),
            mcExe: Global.getDefaultMCExePath(),
            step: 0,
            title: 'welcome'
        }
    }

    nextStep = () => {
        this.setState({
            step: this.state.step + 1
        })
    }

    chooseHomeDirectory = () => {
        let p = dialog.showOpenDialog({
            title: 'Choose your Minecraft Home Directory',
            defaultPath: Global.getDefaultMinecraftPath(),
            buttonLabel: 'Select Directory',
            properties: ['openDirectory', 'showHiddenFiles']
        });
        this.setState({
            mcHome: p[0]
        })
    }

    start = async () => {
        this.setState({
            preparing: true
        });
        SettingsManager.setHomeDirectory(this.state.mcHome);
        SettingsManager.setMCExe(this.state.mcExe)
        let mcl = path.join(LibrariesManager.getLibrariesPath(), '/minecraftmanager');
        if(!fs.existsSync(mcl)) {
            fs.mkdirSync(mcl);
        }

        if(!fs.existsSync(LibrariesManager.getMCMLibraries())) {
            fs.mkdirSync(LibrariesManager.getMCMLibraries());
        }


        let result = await Global.updateMCVersions(true);
        if(result === 'no-connection') {
            this.setState({
                preparing: false
            })
        }else{
            if(!fs.existsSync(Global.PROFILES_PATH)) {
                fs.mkdirSync(Global.PROFILES_PATH);
            }
            this.props.history.push('/');
        }
    }

    chooseMCExe = () => {
        let properties;
        if(os.platform() === 'win32') {
            properties = ['openFile', 'showHiddenFiles']
        }else if(os.platform() === 'darwin') {
            properties = ['openDirectory', 'showHiddenFiles', 'treatPackageAsDirectory']
        }
        let p = dialog.showOpenDialog({
            title: 'Choose your Minecraft Executable',
            defaultPath: Global.getDefaultMCExePath(),
            buttonLabel: 'Select File',
            properties: properties
        });
        this.setState({
            mcExe: p[0]
        })
    }
    render() {
        let { preparing, step, title } = this.state;
        return (
            <Page noNavbar>
                <Header title={title} />
                <Content>
                    <Spacing />
                    {
                        !preparing && <>
                            {
                            step === 0 && <>
                                <WelcomeBox>
                                    <Logo />
                                    <Title>Welcome to Minecraft Manager</Title>
                                    <Subtext>the easiest way to manage minecraft mods and modpacks</Subtext>
                                </WelcomeBox>
                                <GB onClick={this.nextStep} color='green'>Continue</GB>
                            </>
                            }

                            {
                                step === 1 && <>
                                    <Spacing />
                                    <Title>Is this where your .minecraft folder is?</Title>
                                
                                    <IH>
                                        <div>
                                            <TI disabled value={this.state.mcHome} />
                                            <Button onClick={this.chooseHomeDirectory} color='green'>change</Button>
                                        </div>
                                    </IH>
                                    <AutofillText>Most people will not have changed this. However if you have, please update it accordingly.</AutofillText>

                                    <GB onClick={this.nextStep} color='green'>Continue</GB>
                                </>
                            }

                            
                            {
                                step === 2 && <>
                                    <Spacing />
                                    <Title>Is this where your Minecraft Executable is?</Title>
                                
                                    <IH>
                                        <div>
                                            <TI disabled value={this.state.mcExe} />
                                            <Button onClick={this.chooseMCExe} color='green'>change</Button>
                                        </div>
                                    </IH>
                                    <AutofillText>Most people will not have changed this. However if you have, please update it accordingly.</AutofillText>

                                    <GB onClick={this.nextStep} color='green'>Continue</GB>
                                </>
                            }

                            {
                                step === 3 && <>
                                    <Spacing />
                                    <Title>You're all set!</Title>
                                    
                                    <Subtext>You're done setting up Minecraft Manager.</Subtext>
                                    <Subtext>If you need help, <a href='https://theemeraldtree.net/mcm/wiki'>check out the Minecraft Manager wiki.</a></Subtext>

                                    <GB onClick={this.start} color='green'>Finish Setup</GB>
                                </>
                            }

                        </>
                    }

                    {
                        preparing && <>
                            <Title>performing first time setup</Title>
                            <Subtext>this should only take a minute...</Subtext>
                        </>
                    }
                </Content>
            </Page>
        )
    }

});