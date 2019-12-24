import React, { PureComponent } from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import styled from 'styled-components';
import SettingsManager from '../../manager/settingsManager';
import About from './pages/about';
import General from './pages/general';
import Help from './pages/help';
const Sidebar = styled.div`
    height: 100%;
    position: absolute;
    background-color: #2b2b2b;
    width: 120px;
`;

const Item = styled.p`
    margin-top: 10px;
    width: 100%;
    display: block;
    height: 25px;
    text-align: center;
    color: white;
    text-decoration: none;
    font-size: 15pt;
    font-weight: 100;
    cursor: pointer;
    &:hover {
        filter: brightness(0.75);
    }
    ${props => props.active && `
        font-weight: bolder;
        &:hover {
            filter: brightness(1.0);
        }
    `}
    margin-bottom: 15px;
`;

const Container = styled.div`
    margin-left: 130px;
    color: white;
    overflow-y: scroll;
    flex: 1 1 auto;
    height: 100%;
`;



const Wrapper = styled.div`
    overflow: hidden;
    height: 100%;
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
            updateDisabled: false,
            settingsPage: 'about'
        }
    }
    
    switchPage = (page) => {
        this.setState({
            settingsPage: page
        })
    }

    render() {
        const { settingsPage } = this.state;
        return (
            <Page>
                <Header showBackButton title='settings' />
                <Wrapper>
                    <Sidebar>
                        <Item onClick={() => this.switchPage('about')} active={settingsPage === 'about'}>about</Item>
                        <Item onClick={() => this.switchPage('general')} active={settingsPage === 'general'}>general</Item>
                        <Item onClick={() => this.switchPage('help')} active={settingsPage === 'help'}>help</Item>
                    </Sidebar>
                    <Container>
                        {settingsPage === 'about' && <About />}
                        {settingsPage === 'general' && <General />}
                        {settingsPage === 'help' && <Help />}
                    </Container>
                </Wrapper>
            </Page>
        )
    }

}