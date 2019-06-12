import React, { Component } from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import styled from 'styled-components';
import Button from '../../component/button/button';
import logo from '../../img/logo-sm.png';
import Detail from '../../component/detail/detail';
import TextInput from '../../component/textinput/textinput';
import InputHolder from '../../component/inputholder/inputholder';
import path from 'path';
const { app } = require('electron').remote;
const { dialog }  = require('electron').remote;
const About = styled.div`
    max-width: 600px;
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
    background-color: grey;s
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
        color: #003ea8;
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
export default class SettingsPage extends Component {
    
    chooseHomeDirectory = () => {
        dialog.showOpenDialog({
            title: 'Choose your Minecraft Home Directory',
            defaultPath: path.join(app.getPath('appData')),
            buttonLabel: 'Select Directory',
            properties: ['openDirectory', 'showHiddenFiles']
        })
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
                        <h2>Minecraft Manager Version 2.0.0 (beta)</h2>
                        <h3>Minecraft Manager is made possible thanks to <a href="https://electronjs.org/">Electron, </a> <a href="https://reactjs.org/">React, </a> and other projects</h3>
                        <h3><a href="https://github.com/stairman06/minecraft-manager">Minecraft Manager is an open source project</a> created by stairman06</h3>
                        <h3>Minecraft Manager also uses <a href="https://github.com/stairman06/omaf">the open-source OMAF standard, </a> also created by stairman06, with help from others</h3>
                    </AboutBottom>
                </About>
                <Settings>
                    <InputHolder>
                        <Detail>MINECRAFT HOME DIRECTORY</Detail>
                        <div>
                            <TextInput />
                            <Button onClick={this.chooseHomeDirectory} color='green'>choose</Button>
                        </div>
                    </InputHolder>
                    <InputHolder>
                        <Detail>DEDICATED RAM</Detail>
                        <div>
                            <TextInput />
                            <Button onClick={this.changeRAM} color='green'>change</Button>
                        </div>
                    </InputHolder>
                </Settings>
            </Page>
        )
    }

}