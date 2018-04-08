import React, { Component } from 'react';
import WindowBar from '../../component/windowBar/windowBar';
import logoLarge from '../../img/logo.png';
import { withRouter } from 'react-router-dom';
import Navbar from '../../component/navbar/navbar';
import TextInput from '../../component/textinput/textinput';
import MinecraftLauncherManager from '../../manager/minecraftLauncherManager';
import Data from '../../util/data';
import { settings as UserSettings } from '../../util/userSettings';
import PageHeader from '../../component/pageheader/pageheader';
import Page, { Main, Content } from '../page';
import styled from 'styled-components';
const os = require('os');
const SettingsWrapper = styled.div`
    overflow-y: scroll;
    overflow-x: hidden;
    padding-bottom: 100px;
`
const MCMVersion = styled.div`
    margin-top: 30px;
    text-align: center;
`
const MCMTitle = styled.p`
    color: white;
    font-size: 25pt;
    margin: 0;
    font-weight: bolder;
`
const MCMLogo = styled.img`
    margin-top: 20px;
    text-align: center;
    width: 250px;
    margin: 0 auto;
`
const MCMVersionText = styled.p`
    margin: 0;
    color: white;
    text-align: center;
    font-size: 20pt;
`
const MCMCare = styled.p`
    color: white;
    margin: 0;
`
const Setting = styled.div`
    margin: 10px;
    margin-top: 80px;
    background-color: #8e8e8e;
    padding: 10px;
    border-radius: 13px;
`
const ErrorText = styled.p`
    color: red;
    font-weight: bolder;
    margin: 0;
`
export default withRouter(class SettingsPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: false,
            errorTitle: '',
            errorDesc: '',
            valInput: '',
            ramErrorText: ''
        }
    }
    ramChange = (e) => {
        let ramTotal;
    
        if(Math.ceil(((os.totalmem())/1048576)/1024) % 2 === 0) {
          ramTotal = Math.ceil(((os.totalmem())/1048576)/1024);
        }else{
          ramTotal = Math.floor(((os.totalmem())/1048576)/1024);
        }

        let val = parseInt(e.target.value);
        if(val >= ramTotal) {
            this.setState({
                ramErrorText: `Do not set the RAM amount equal or higher than your PC's amount of ram!`
            })
        }else if(val === 0 || e.target.value === '') {
            this.setState({
                ramErrorText: 'You must provide a RAM amount!'
            })
        }else if(e.target.value.indexOf('.') > -1) {
            this.setState({
                ramErrorText: 'You cannot set the RAM amount to a decimal!'
            })
        }else{
            this.setState({
                ramErrorText: ''
            })
            UserSettings.setOption('ram', val);
            MinecraftLauncherManager.updateRam();
        }
    }
    render() {
        return (
            <Page>
                <WindowBar />
                    <Main>
                        <Navbar />
                        <Content>
                            <PageHeader title='Settings' showBackButton={false} />
                            <SettingsWrapper>
                                <MCMVersion>
                                    <MCMTitle>Minecraft Manager</MCMTitle>
                                    <MCMLogo src={logoLarge} />
                                    <MCMVersionText>{Data.getMCMDate()} {Data.getMCMVersion()}</MCMVersionText>
                                    <MCMCare>Assembled with care by stairman06</MCMCare>
                                </MCMVersion>
                                <Setting>
                                    <TextInput preventDecimal onChange={this.ramChange} type='number' label='RAM Allocation (Gigabytes)' defaultValue={UserSettings.readOption('ram').toString()} />
                                    <ErrorText>{this.state.ramErrorText}</ErrorText>
                                </Setting>
                            </SettingsWrapper>
                        </Content>
                    </Main>
            </Page>
        )
    }
});