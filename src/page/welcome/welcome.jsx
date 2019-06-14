import React, { Component } from 'react';
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
const { dialog }  = require('electron').remote;
const Title = styled.p`
    color: white;
    font-size: 32pt;
    font-weight: 200;
    margin: 0;
`

const Subtext = styled.p`
    color: white;
`

const Content = styled.div`
    padding: 5px;
`

const TI = styled(TextInput)`
    max-width: 680px;
    width: 100%;
`

const GB = styled(Button)`
    margin-top: 20px;
`
export default withRouter(class WelcomePage extends Component {
    constructor() {
        super();
        this.state = {
            mcHome: Global.getDefaultMinecraftPath()
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

    start = () => {
        fs.mkdirSync(Global.PROFILES_PATH);
        SettingsManager.setHomeDirectory(this.state.mcHome);
        this.props.history.push('/');
    }

    render() {
        return (
            <Page noNavbar>
                <Header title='welcome' />
                <Content>
                    <Title>Welcome to Minecraft Manager</Title>
                    <Subtext>Before you start, what's your Minecraft Home Folder? This is typically referred to as the <b>.minecraft</b> folder</Subtext>

                    <InputHolder>
                        <div>
                            <TI disabled value={this.state.mcHome} />
                            <Button onClick={this.chooseHomeDirectory} color='green'>choose</Button>
                        </div>
                    </InputHolder>

                    <GB onClick={this.start} color='green'>Go!</GB>
                </Content>
            </Page>
        )
    }

});