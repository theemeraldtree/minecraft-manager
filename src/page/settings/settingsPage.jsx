import React, { PureComponent } from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import styled from 'styled-components';
import Button from '../../component/button/button';
import logo from '../../img/logo-sm.png';
import Detail from '../../component/detail/detail';
import TextInput from '../../component/textinput/textinput';
import InputHolder from '../../component/inputholder/inputholder';
import Global from '../../util/global';
import SettingsManager from '../../manager/settingsManager';
import os from 'os';
import { ipcRenderer } from 'electron';
const { dialog }  = require('electron').remote;
const About = styled.div`
    max-width: 680px;
    background-color: #717171;
    margin: 10px;
`

const Settings = styled.div`
    margin: 10px;
`

const AboutTop = styled.div`
    display: flex;
    align-items: center;
    padding: 10px;
    h1 {
        color: white;
        margin: 5px;
        font-size: 17pt;
    }
    background-color: grey;
`

const AboutBottom = styled.div`
    padding: 10px;
    color: white;
    h2 {
        font-size: 14pt;
    }
    h3 {
        font-size: 11pt;
        margin-top: 5px;
        margin-bottom: 5px;
    }
    a {
        color: #42b3f5;
        text-decoration: none;
    }
`

const Logo = styled.div`
    width: 80px;
    height: 80px;
    background-image: url(${logo});
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
`

const WarningMSG = styled.p`
    color: red;
`

const PathInput = styled(TextInput)`
    width: 590px;
`

const Updates = styled.div`
    margin-bottom: 10px;
`
export default class SettingsPage extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            mcHome: SettingsManager.MC_HOME,
            mcExe: SettingsManager.currentSettings.mcExe,
            dedicatedRam: SettingsManager.currentSettings.dedicatedRam,
            ramChangeDisabled: true,
            updateText: 'check for updates',
            updateDisabled: false
        }
    }
    chooseHomeDirectory = () => {
        let p = dialog.showOpenDialog({
            title: 'Choose your Minecraft Home Directory',
            defaultPath: Global.getDefaultMinecraftPath(),
            buttonLabel: 'Select Directory',
            properties: ['openDirectory', 'showHiddenFiles']
        });
        SettingsManager.setHomeDirectory(p[0]);
        this.setState({
            mcHome: p[0]
        })
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
        SettingsManager.setHomeDirectory(p[0]);
        this.setState({
            mcExe: p[0]
        })
    }

    ramAmountChange = (e) => {
        let newAmount = e.target.value;
        let oldAmount = SettingsManager.currentSettings.dedicatedRam.toString();

        if(/^[0-9\b]+$/.test(newAmount) || newAmount === '') {
            this.setState({
                ramChangeDisabled: true,
                dedicatedRam: newAmount
            })

            let intAmount = parseInt(newAmount);
            if(intAmount >= Math.ceil(os.totalmem() / 1000000000)) {
                this.setState({
                    warningMessage: 'That is equal to or higher than your available RAM! Please set it lower!'
                })
            }else if(newAmount === '') {
                this.setState({
                    warningMessage: 'Please enter a value'
                })
            }else if(intAmount === 0) {
                this.setState({
                    warningMessage: 'You need to provide SOME amount of RAM!'
                })
            }else{
                this.setState({
                    ramChangeDisabled: newAmount === oldAmount,
                    warningMessage: ''
                })
            }
        }
    }

    changeRAM = () => {
        if(!this.state.ramChangeDisabled) {
            SettingsManager.setDedicatedRam(this.state.dedicatedRam);
            this.setState({
                ramChangeDisabled: true
            })
        }
    }

    checkForUpdates = () => {
        if(this.state.updateText !== 'restart') {
            this.setState({
                updateDisabled: true,
                updateText: 'checking for updates...',
                updateSubText: ''
            });

            ipcRenderer.send('check-for-updates');

            ipcRenderer.on('update-available', () => {
                this.setState({
                    updateText: 'downloading',
                    updateDisabled: true,
                    updateSubText: 'Update available. Downloading...'
                })
            });

            ipcRenderer.on('update-downloaded', () => {
                this.setState({
                    updateSubText: 'Restart to install the update',
                    updateText: 'restart',
                    updateDisabled: false
                })
            })

            ipcRenderer.on('error', (event, err) => {
                console.error(err);
                this.setState({
                    updateText: 'check for updates',
                    updateDisabled: false,
                    updateSubText: `Error checking for updates.`
                })
            })

            ipcRenderer.on('update-not-available', () => {
                this.setState({
                    updateText: 'check for updates',
                    updateDisabled: false,
                    updateSubText: 'Update not available'
                })
            })
        }else{
            ipcRenderer.send('install-update');
        }
    }

    render() {
        return (
            <Page>
                <Header showBackButton title='settings' />
                <About>
                    <AboutTop>
                        <Logo />
                        <h1>About Minecraft Manager</h1>
                    </AboutTop>
                    <AboutBottom>
                        <h2>Minecraft Manager Version 2.0.1</h2>
                        <h2>released 8/8/2019</h2>

                        <Updates>
                            <Button onClick={this.checkForUpdates} disabled={this.state.updateDisabled} color='green'>{this.state.updateText}</Button>
                            <h3>{this.state.updateSubText}</h3>
                        </Updates>
                        <h3>Minecraft Manager is made possible thanks to <a href="https://electronjs.org/">Electron, </a> <a href="https://reactjs.org/">React, </a> <a href="https://webpack.js.org">Webpack,</a> and other projects</h3>
                        <h3><a title="Minecraft Manager Source Code" href="https://github.com/stairman06/minecraft-manager">Minecraft Manager is an open source project</a> created by stairman06</h3>
                        <h3><a title="OMAF Wiki and Documentation" href="https://github.com/stairman06/omaf/wiki">Minecraft Manager uses the open-source OMAF standard, </a> created by stairman06, with help from others</h3>
                        <h3><a title="Roboto Font License" href="http://www.apache.org/licenses/LICENSE-2.0.html">Minecraft Manager uses the Roboto font created by Google.</a></h3>

                        <h2>Need help?</h2>
                        <h3><a href="https://github.com/stairman06/minecraft-manager/wiki">Check out the Minecraft Manager Wiki</a></h3>
                        <h3><a href="https://github.com/stairman06/minecraft-manager/issues">Found a bug or want to request a feature? Do it here</a></h3>
                    </AboutBottom>
                </About>
                <Settings>
                    <InputHolder>
                        <Detail>MINECRAFT HOME DIRECTORY</Detail>
                        <div>
                            <PathInput disabled value={this.state.mcHome} />
                            <Button onClick={this.chooseHomeDirectory} color='green'>choose</Button>
                        </div>
                    </InputHolder>
                    <InputHolder>
                        <Detail>MINECRAFT EXECUTABLE</Detail>
                        <div>
                            <PathInput disabled value={this.state.mcExe} />
                            <Button onClick={this.chooseMCExe} color='green'>choose</Button>
                        </div>
                    </InputHolder>
                    <InputHolder>
                        <Detail>DEDICATED RAM</Detail>
                        <div>
                            <TextInput onChange={this.ramAmountChange} value={this.state.dedicatedRam} />
                            <Button disabled={this.state.ramChangeDisabled} onClick={this.changeRAM} color='green'>change</Button>
                        </div>
                        <WarningMSG>{this.state.warningMessage}</WarningMSG>
                    </InputHolder>
                </Settings>
            </Page>
        )
    }

}