import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { remote } from 'electron';
import os from 'os';
import { withRouter } from 'react-router-dom';
import minimizeImage from './img/minimize.png';
import maximizeImage from './img/maximize.png';
import closeImage from './img/close.png';
import settingsImage from './img/settings.png';

const currentWindow = remote.getCurrentWindow();

const ActionButton = styled.div`
  width: 29px;
  height: 29px;
  z-index: 20;
  top: 0;
  float: right;
  background-color: #1d1d1d;
  background-size: 15px;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  -webkit-app-region: no-drag;
  &:hover {
    background-color: black;
  }
`;

const MinimizeButton = styled(ActionButton)`
  background-image: url(${minimizeImage});
`;

const MaximizeButton = styled(ActionButton)`
  background-image: url(${maximizeImage});
`;

const CloseButton = styled(ActionButton)`
  background-image: url(${closeImage});
  &:hover {
    filter: brightness(0.9);
    background-color: red;
  }
`;

const SettingsButton = styled(ActionButton)`
  background-image: url(${settingsImage});
  ${os.platform() === 'darwin' &&
    css`
        position: absolute;
        right: 0;
        top: 0;
        height: 14px;
        width: 14px;
        background-position: 0 50%:
    `}
`;

class ActionButtons extends Component {
  openSettings = () => {
    const { history } = this.props;
    history.push('/settings');
  };

  close = () => {
    currentWindow.close();
  };

  maximize = () => {
    if (!currentWindow.isMaximized()) {
      currentWindow.maximize();
    } else {
      currentWindow.unmaximize();
    }
  };

  minimize = () => {
    currentWindow.minimize();
  };

  render() {
    const { location } = this.props;
    return (
      <>
        {os.platform() === 'win32' && (
          <>
            <CloseButton onClick={this.close} />
            <MaximizeButton onClick={this.maximize} />
            <MinimizeButton onClick={this.minimize} />
          </>
        )}
        {location.pathname !== '/welcome' && <SettingsButton onClick={this.openSettings} />}
      </>
    );
  }
}

ActionButtons.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string
  }).isRequired
};

export default withRouter(ActionButtons);
