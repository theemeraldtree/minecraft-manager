import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import fs from 'fs';
import styled, { keyframes, css } from 'styled-components';
import downloadsImg from './downloads.png';
import DownloadItem from './downloadItem';
import DownloadsManager from '../../../manager/downloadsManager';
import Global from '../../../util/global';

const Wrapper = styled.div`
  width: 20px;
  height: 35px;
  display: flex;
  justify-content: center;
  position: absolute;
  top: 0;
  right: 150px;
  align-items: flex-end;
  z-index: 51;
  -webkit-app-region: no-drag;
  ${props => !props.isSetup && css`
    z-index: 1;
  `}
`;

const DownloadsButton = styled.button`
  width: 24px;
  height: 28px;
  position: absolute;
  bottom: 5px;
  cursor: pointer;
  background-color: transparent;
  border: 0;
  background-image: url(${downloadsImg});
  background-size: contain;
  background-position-y: 7px;
  background-repeat: no-repeat;
  &:hover {
    filter: brightness(0.75);
  }
  &:focus-visible {
    outline: 2px solid yellow;
    outline-offset: 5px;
  }
`;

const Animation = keyframes`
    0% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
`;

const AnimationBar = styled.div`
  width: 50px;
  height: 3px;
  background: grey;
  margin-bottom: 2px;
  ${props =>
    props.active &&
    css`
      background: linear-gradient(270deg, #0a993c, #0a993c, #0add53, #0a993c, #0a993c) !important;
      background-size: 600% 600% !important;
      animation: ${Animation} 1.5s ease infinite normal !important;
    `}
`;

const slideIn = keyframes`
  0% {
    top: 37px;
    opacity: 0;
  }
  100% {
    top: 47px;
  }
`;

const DownloadsOverlay = styled.div`
  width: 350px;
  height: 350px;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 10000;
  cursor: default;
  position: absolute;
  right: -130px;
  top: 47px;
  color: white;
  display: flex;
  flex-flow: column;
  animation: 150ms ${slideIn} linear;
  border-radius: 10px;
`;

const Title = styled.p`
  font-size: 16pt;
  margin: 5px;
  font-weight: 900;
`;

const List = styled.div`
  overflow-y: overlay;
  overflow-x: hidden;
  flex: 1 1 auto;
  box-sizing: content-box;
  width: 100%;
`;

export default class Downloads extends Component {
  constructor() {
    super();
    this.state = {
      downloadsList: [],
      showOverlay: false
    };
  }

  componentDidMount() {
    if (localStorage.getItem('showDownloads') === 'true') {
      this.setState({
        showOverlay: true
      });
    }

    DownloadsManager.registerDownloadsViewer(downloadsList => {
      if (downloadsList.length >= 1) {
        ipcRenderer.send('start-progress');
        this.setState({
          downloadsList
        });
      } else {
        ipcRenderer.send('stop-progress');
        this.setState({
          downloadsList: []
        });
      }
    });
  }

  showDownloads = () => {
    const { showOverlay } = this.state;

    localStorage.setItem('showDownloads', !showOverlay);
    this.setState({
      showOverlay: !showOverlay
    });
  };

  render() {
    const { downloadsList } = this.state;
    const setup = fs.existsSync(Global.PROFILES_PATH);
    return (
      <Wrapper isSetup={setup}>
        <DownloadsButton tabIndex={setup ? 1 : -1} onClick={this.showDownloads} />
        <AnimationBar active={downloadsList.length} />
        {this.state.showOverlay && (
          <DownloadsOverlay>
            <Title>Active Downloads</Title>
            <List>
              {downloadsList.map(download => (
                <DownloadItem key={download.name} download={download} />
              ))}
            </List>
          </DownloadsOverlay>
        )}
      </Wrapper>
    );
  }
}
