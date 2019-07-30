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
    background-color: #717171;
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
            mcExe: Global.getDefaultMCExePath()
        }
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
        let { preparing } = this.state;
        return (
            <Page noNavbar>
                <Header title='welcome' />
                <Content>
                    <Spacing />
                    {!preparing && <>
                    <WelcomeBox>
                        <Logo />
                        <Title>Welcome to Minecraft Manager</Title>
                        <Subtext>the easiest way to manage minecraft mods and modpacks</Subtext>
                    </WelcomeBox>

                    <Spacing />
                    <Subtext>What is your Minecraft Home Directory? This is typically referred to as the .minecraft folder.</Subtext>

                    <IH>
                        <div>
                            <TI disabled value={this.state.mcHome} />
                            <Button onClick={this.chooseHomeDirectory} color='green'>choose</Button>
                        </div>
                    </IH>
                    <AutofillText>This field has been autofilled with our best guess. Most people will not have changed their home directory</AutofillText>

                    <Spacing />
                    <Subtext>Where's your Minecraft Executable, or Minecraft Launcher application?</Subtext>

                    <IH>
                        <div>
                            <TI disabled value={this.state.mcExe} />
                            <Button onClick={this.chooseMCExe} color='green'>choose</Button>
                        </div>
                    </IH>
                    <AutofillText>This field has been autofilled with our best guess. Most people will not have changed their executable path</AutofillText>

                    <GB onClick={this.start} color='green'>All done, let's go!</GB>
                    </>}
                    {preparing && <>
                    <Title>performing first time setup</Title>
                    <Subtext>This should only take a minute...</Subtext>
                    </>}
                </Content>
            </Page>
        )
    }

});