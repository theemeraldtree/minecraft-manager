import React, {Component} from 'react';
import styled, {css} from 'styled-components';
import { withRouter } from 'react-router-dom';
import Colors from '../../style/colors';
import ActionButtons from './actionButtons';
const remote = require('electron').remote; 
const currentWindow = remote.getCurrentWindow();
const os = require('os');
const Wrapper = styled.div`
    flex: 0 1 30px;
    height: 30px;
    background-color: ${Colors.windowbar};
    width: 100%;
    -webkit-app-region: drag;
    z-index: 900;
    display: block;
    ${os.platform() === 'darwin' && css`
        height: 23px;
        flex: 0 1 23px;
    `}
`
const Title = styled.p`
    position: absolute;
    color: white;
    top: 5px;
    left: 5px;
    font-weight: bolder;
    margin: 0;
    -webkit-app-region: drag;
    cursor: default;
    ${os.platform() === 'darwin' && css`
        text-align: center;
        top: 0;
        position: initial;
    `}
`
export default withRouter(class WindowBar extends Component {
    minimizeWindow() {
        currentWindow.minimize();
    }
    maximizeWindow() {
        if(!currentWindow.isMaximized()) {
            currentWindow.maximize();
        }else{
            currentWindow.unmaximize();
        }    }
    closeWindow() {
        currentWindow.close();
    }
    openSettings = () => {
        this.props.history.push('/settings');
    }
    render() {
        return (
            <Wrapper>
                <div className='top' />
                <Title>MINECRAFT MANAGER</Title>
                <ActionButtons />
            </Wrapper>
        );
    }
});