import React, { Component } from 'react';
import styled from 'styled-components';
import Button from '../button/button';
import ProfilesManager from '../../manager/profilesManager';
import path from 'path';
import Overlay from '../overlay/overlay';
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
  min-height: 100px;
`;
const Title = styled.p`
  margin: 0;
  font-weight: 200;
  font-size: 21pt;
`;
const Subtext = styled.p`
  margin: 0;
`;

const BTN = styled(Button)`
  display: inline-block;
  margin-right: 5px;
`;

const ButtonContainer = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  div {
    margin: 2px;
  }
  display: flex;
  align-items: center;
`;
export default class ImportOverlay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      updateState: '',
      error: ''
    };
  }
  chooseFile = () => {
    let p = dialog.showOpenDialog({
      title: 'Choose a file to import',
      buttonLabel: 'Import',
      filters: [
        {
          name: 'Minecraft Java Profile',
          extensions: ['mcjprofile']
        }
      ]
    });
    if (p[0]) {
      ProfilesManager.importProfile(p[0], this.stateChange)
        .then(this.done)
        .catch(this.error);
    }
  };
  stateChange = stateChange => {
    this.setState({
      updateState: stateChange
    });
  };
  done = () => {
    ProfilesManager.getProfiles().then(() => {
      this.props.cancelClick();
      this.setState({
        updateState: ''
      });
    });
  };
  error = err => {
    this.setState({
      showError: true,
      error: err.toString()
    });
  };
  importFile = () => {
    ProfilesManager.importProfile(this.props.file, this.stateChange)
      .then(this.done)
      .catch(this.error);
  };
  render() {
    const { updateState, showError, error } = this.state;
    const { cancelClick, file } = this.props;
    return (
      <Overlay in={this.props.in}>
        <BG>
          {!updateState && !showError && !file && (
            <>
              <Title>import a profile</Title>
              <Subtext>
                Choose the <b>.mcjprofile</b> file that you would like to import
              </Subtext>
              <ButtonContainer>
                <BTN onClick={cancelClick} color="red">
                  cancel
                </BTN>
                <BTN onClick={this.chooseFile} color="green">
                  choose a file
                </BTN>
              </ButtonContainer>
            </>
          )}

          {file && !updateState && !showError && (
            <>
              <Title>import</Title>
              <Subtext>
                Do you want to import the file <b>{path.basename(file)}</b>?
              </Subtext>
              <ButtonContainer>
                <BTN onClick={cancelClick} color="red">
                  no
                </BTN>
                <BTN onClick={this.importFile} color="green">
                  yes
                </BTN>
              </ButtonContainer>
            </>
          )}

          {showError && (
            <>
              <Title>Error</Title>
              <Subtext>{error}</Subtext>
              <Button onClick={cancelClick} color="red">
                close
              </Button>
            </>
          )}

          {updateState && !showError && (
            <>
              <Title>importing...</Title>
              <Subtext>{updateState}</Subtext>
            </>
          )}
        </BG>
      </Overlay>
    );
  }
}
