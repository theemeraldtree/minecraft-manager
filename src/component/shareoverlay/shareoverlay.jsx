import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import fs from 'fs';
import path from 'path';
import Overlay from '../overlay/overlay';
import Button from '../button/button';
import Checkbox from '../checkbox/checkbox';
import AlertBackground from '../alert/alertbackground';

const { dialog } = require('electron').remote;

const BG = styled(AlertBackground)`
  width: 100%;
  height: fit-content;
  max-width: 600px;
  max-height: 500px;
  padding: 10px;
  color: white;
  display: flex;
  flex-flow: column;
`;

const Title = styled.p`
  margin: 0;
  font-weight: 200;
  font-size: 21pt;
`;

const Subtext = styled.p`
  margin: 0;
`;

const Breaker = styled.div`
  height: 29px;
`;

const ExportList = styled.div`
  overflow-y: auto;
  background-color: #404040;
  margin-top: 5px;
  height: min-content;
  &::-webkit-scrollbar-track {
    background: none;
  }
`;

const ExportItem = styled.div`
  border-bottom: 2px solid #222;
  display: flex;
  align-items: center;
  padding-left: 5px;
  &:last-child {
    border: 0;
  }
`;

const Label = styled.p`
  display: inline-block;
  margin-left: 5px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
  flex-shrink: 0;
  button {
    margin-right: 5px;
  }
`;

export default class ShareOverlay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayState: 'main',
      exportProgress: 'Waiting...'
    };
  }

  componentDidUpdate(prevProps) {
    const { profile } = this.props;
    if (prevProps.profile !== profile && profile !== undefined) {
      this.useProfile();
    }
  }

  enableFolder = e => {
    const { exportFolders } = this.state;
    exportFolders[e.currentTarget.dataset.info] = !exportFolders[e.currentTarget.dataset.info];
    this.setState({
      exportFolders
    });
  };

  exportClick = () => {
    const { profile } = this.props;
    const { exportFolders } = this.state;
    const p = dialog.showSaveDialog({
      title: 'Where do you want to export to?',
      buttonLabel: 'Export here',
      defaultPath: `${profile.name}.mcjprofile`,
      filters: [
        {
          name: 'Minecraft Java Profile',
          extensions: ['mcjprofile']
        }
      ]
    });
    if (p) {
      profile
        .export(p, exportFolders, progress => {
          this.setState({
            exportProgress: progress
          });
        })
        .then(() => {
          this.props.cancelClick();
        })
        .catch(() => {
          this.props.cancelClick();
        });
      this.setState({
        displayState: 'progress'
      });
    }
  };

  useProfile() {
    const { profile } = this.props;
    const files = fs.readdirSync(profile.gameDir);
    if (files.length) {
      const exportFolders = [];
      const exportItems = [];

      files.forEach(file => {
        if (file !== 'mods') {
          if (fs.lstatSync(path.join(profile.gameDir, file)).isDirectory()) {
            exportFolders[file] = false;
            exportItems.push(
              <ExportItem key={file}>
                <Checkbox info={file} onClick={this.enableFolder} type="checkbox" />
                <Label>{file}</Label>
              </ExportItem>
            );
          }
        } else {
          exportItems.unshift(
            <ExportItem key="mods">
              <Checkbox type="checkbox" checked disabled />
              <Label>mods</Label>
            </ExportItem>
          );
        }
      });

      this.setState({
        exportFolders,
        exportItems
      });
    }
  }

  render() {
    return (
      <Overlay force in={this.props.show}>
        <BG>
          {this.state.displayState === 'main' && (
            <>
              <Title>share your profile</Title>
              <Subtext>
                exporting your profile will export it to the <b>.mcjprofile</b> file format, which can be used in
                Minecraft Manager or other OMAF-supporting apps
              </Subtext>
              <Breaker />
              {this.state.exportItems && (
                <>
                  <Title>choose your folders</Title>
                  <Subtext>
                    choose your folders that you'd like to include with your export. if you have mods installed, they
                    are automatically included
                  </Subtext>
                  <ExportList>{this.state.exportItems}</ExportList>
                </>
              )}
              <ButtonsContainer>
                <Button onClick={this.props.cancelClick} color="red">
                  cancel
                </Button>
                <Button onClick={this.exportClick} color="green">
                  export
                </Button>
              </ButtonsContainer>
            </>
          )}
          {this.state.displayState === 'progress' && (
            <>
              <Title>exporting...</Title>
              <Subtext>{this.state.exportProgress}</Subtext>
            </>
          )}
        </BG>
      </Overlay>
    );
  }
}

ShareOverlay.propTypes = {
  profile: PropTypes.object,
  cancelClick: PropTypes.func,
  show: PropTypes.bool.isRequired
};
