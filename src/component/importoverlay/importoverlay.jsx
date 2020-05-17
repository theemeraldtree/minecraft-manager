import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import path from 'path';
import Button from '../button/button';
import ProfilesManager from '../../manager/profilesManager';
import Overlay from '../overlay/overlay';
import AlertBackground from '../alert/alertbackground';
import HeaderButton from '../headerButton/headerButton';
import MultiMC from '../../util/multimc';

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
  min-height: 160px;
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

const HBWrapper = styled.div`
  margin-top: 5px;
  margin-bottom: 5px;
  min-height: 46px;
`;

export default class ImportOverlay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      updateState: '',
      error: '',
      displayState: 'omaf'
    };
  }

  componentDidMount() {
    this.setState({
      showError: false,
      error: ''
    });
  }

  chooseFile = () => {
    const p = dialog.showOpenDialog({
      title: 'Choose a file to import',
      buttonLabel: 'Import',
      filters: [
        {
          name: 'Minecraft Java Profile',
          extensions: ['mcjprofile']
        }
      ]
    });
    if (p && p[0]) {
      ProfilesManager.importProfile(p[0], this.stateChange)
        .then(this.done)
        .catch(this.error);
    }
  };

  chooseFileMMC = () => {
    const p = dialog.showOpenDialog({
      title: 'Choose a file to import',
      buttonLabel: 'Import',
      filters: [
        {
          name: 'MultiMC zip',
          extensions: ['zip']
        }
      ]
    });
    if (p && p[0]) {
      MultiMC.import(p[0], this.stateChange)
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
      error: err.message
    });
  };

  importFile = () => {
    ProfilesManager.importProfile(this.props.file, this.stateChange)
      .then(this.done)
      .catch(this.error);
  };

  switchOMAF = () => {
    this.setState({
      displayState: 'omaf'
    });
  };

  switchMMC = () => {
    this.setState({
      displayState: 'mmc'
    });
  };

  render() {
    const { updateState, showError, error, displayState } = this.state;
    const { cancelClick, file } = this.props;
    return (
      <Overlay in={this.props.in}>
        <BG>
          {!updateState && !showError && !file && <Title>import a profile</Title>}
          {!updateState && !showError && !file && (
            <HBWrapper>
              <HeaderButton active={displayState === 'omaf'} onClick={this.switchOMAF}>
                OMAF .mcjprofile
              </HeaderButton>
              <HeaderButton active={displayState === 'mmc'} onClick={this.switchMMC}>
                MultiMC .zip
              </HeaderButton>
            </HBWrapper>
          )}

          {displayState === 'omaf' && !updateState && !showError && !file && (
            <>
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

          {displayState === 'mmc' && !updateState && !showError && !file && (
            <>
              <Subtext>
                Choose the MultiMC <b>.zip</b> file that you would like to import
              </Subtext>
              <ButtonContainer>
                <BTN onClick={cancelClick} color="red">
                  cancel
                </BTN>
                <BTN onClick={this.chooseFileMMC} color="green">
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
                  cancel
                </BTN>
                <BTN onClick={this.importFile} color="green">
                  import
                </BTN>
              </ButtonContainer>
            </>
          )}

          {showError && (
            <>
              <Title>error</Title>
              <Subtext>{error}</Subtext>
              <ButtonContainer>
                <BTN onClick={cancelClick} color="red">
                  close
                </BTN>
              </ButtonContainer>
            </>
          )}

          {updateState && !showError && (
            <>
              <Title>importing...</Title>
              <Subtext>{updateState}</Subtext>
              <Subtext>To check progress, open the Downloads viewer in the sidebar</Subtext>
            </>
          )}
        </BG>
      </Overlay>
    );
  }
}

ImportOverlay.propTypes = {
  cancelClick: PropTypes.func.isRequired,
  file: PropTypes.object,
  in: PropTypes.bool
};
