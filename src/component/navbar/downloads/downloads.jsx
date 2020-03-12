import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import styled, { keyframes, css } from 'styled-components';
import downloadsImg from './downloads.png';
import DownloadItem from './downloadItem';
import DownloadsManager from '../../../manager/downloadsManager';

const Wrapper = styled.div`
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  position: absolute;
  bottom: 0;
  align-items: flex-end;
  z-index: 51;
`;

const DownloadsButton = styled.div`
  width: 50px;
  height: 50px;
  position: absolute;
  bottom: 23px;
  cursor: pointer;
  background-image: url(${downloadsImg});
  background-size: contain;
  background-position-y: 7px;
  background-repeat: no-repeat;
  &:hover {
    filter: brightness(0.75);
  }
`;

const Animation = keyframes`
    0% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
`;

const AnimationBar = styled.div`
  width: 50px;
  height: 4px;
  background: grey;
  margin-bottom: 20px;
  ${props =>
    props.active &&
    css`
      background: linear-gradient(270deg, #0a993c, #0a993c, #0add53, #0a993c, #0a993c) !important;
      background-size: 600% 600% !important;
      animation: ${Animation} 1.5s ease infinite normal !important;
    `}
`;

const DownloadsOverlay = styled.div`
  width: 350px;
  height: 350px;
  background-color: #1d1d1d;
  z-index: 10000;
  cursor: default;
  position: absolute;
  left: 120px;
  bottom: 20px;
  color: white;
  display: flex;
  flex-flow: column;
`;

const Title = styled.p`
  font-size: 21pt;
  margin: 5px;
  font-weight: 200;
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
    return (
      <Wrapper>
        <DownloadsButton onClick={this.showDownloads} />
        <AnimationBar active={downloadsList.length} />
        {this.state.showOverlay && (
          <DownloadsOverlay>
            <Title>downloads</Title>
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
