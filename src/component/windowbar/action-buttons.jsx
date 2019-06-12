import React, { Component, Fragment } from 'react';
import styled, { css } from 'styled-components';
import { remote } from 'electron';
import { withRouter } from 'react-router-dom';
import minimizeImage from './img/minimize.png';
import maximizeImage from './img/maximize.png';
import closeImage from './img/close.png';
import settingsImage from './img/settings.png';
import os from 'os';

const currentWindow = remote.getCurrentWindow();

const ActionButton = styled.div`
    width: 20px;
    height: 20px;
    margin: 4px;
    z-index: 20;
    top: 0;
    float: right;
    background-size: cover;
    transition: -webkit-filter 300ms;
    cursor: pointer;
    -webkit-app-region: no-drag;
    &:hover {
        filter: brightness(0.5);
        transition: -webkit-filter 300ms;
    }
`

const MinimizeButton = styled(ActionButton)`
    background-image: url(${minimizeImage});
`
const MaximizeButton = styled(ActionButton)`
    background-image: url(${maximizeImage});
`
const CloseButton = styled(ActionButton)`
    background-image: url(${closeImage});
`

const SettingsButton = styled(ActionButton)`
    background-image: url(${settingsImage});
    ${os.platform() === 'darwin' && css`
        position: absolute;
        right: 0;
        top: 0;
        height: 14px;
        width: 14px;
        background-position: 0 50%:
    `}
`

export default withRouter(
class ActionButtons extends Component {

    openSettings = () => {
        this.props.history.push('/settings');
    }

    close = () => {
        currentWindow.close();
    }
    
    maximize = () => {
        if(!currentWindow.isMaximized()) {
            currentWindow.maximize();
        }else{
            currentWindow.unmaximize();
        }
    }
    
    minimize = () => {
        currentWindow.minimize();
    }

    render() {
        return (
            <Fragment>
                {os.platform() === 'win32' && 
                <Fragment>
                    <CloseButton onClick={this.close} />
                    <MaximizeButton onClick={this.maximize} />
                    <MinimizeButton onClick={this.minimize} />
                </Fragment>}
                {this.props.location.pathname !== '/welcome' && <SettingsButton onClick={this.openSettings} />}
            </Fragment>
        );
    }
});

