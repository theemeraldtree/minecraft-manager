import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import path from 'path';
import { Button } from '@theemeraldtree/emeraldui';
import ProfilesManager from '../../manager/profilesManager';
import Overlay from '../overlay/overlay';
import AlertBackground from '../alert/alertbackground';
import Twitch from '../../util/format/twitch';
import Global from '../../util/global';
import Scanner from '../../util/scanner/scanner';
import FormatImporter from '../../util/format/formatImporter';

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

export default class ImportOverlay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      updateState: '',
      error: ''
    };
  }

  componentDidMount() {
    this.setState({
      showError: false,
      error: ''
    });
  }

  chooseFile = () => {
    const p = dialog.showOpenDialogSync({
      title: 'Choose a file to import',
      buttonLabel: 'Import',
      filters: [
        {
          name: 'Importable Filetype',
          extensions: ['mcjprofile', 'zip']
        }
      ]
    });
    if (p && p[0]) {
      FormatImporter.importFile(p[0], this.stateChange)
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
    Global.updateCache();
    ProfilesManager.getProfiles().then(async () => {
      await Scanner.scanProfiles();
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

  chooseFileTwitch = () => {
    const p = dialog.showOpenDialogSync({
      title: 'Choose a file to import',
      buttonLabel: 'Import',
      filters: [
        {
          name: 'Twitch zip',
          extensions: ['zip']
        }
      ]
    });

    if (p && p[0]) {
      Twitch.importZip(p[0], this.stateChange)
        .then(this.done)
        .catch(this.error);
    }
  };

  clickCancel = () => {
    setTimeout(() => {
      this.setState({
        error: '',
        showError: false,
        updateState: false
      });
    }, 150);

    this.props.cancelClick();
  };

  render() {
    const { updateState, showError, error } = this.state;
    const { file } = this.props;

    return (
      <Overlay in={this.props.in}>
        <BG>
          {!updateState && !showError && !file && <Title>Import an instance</Title>}
          {!updateState && !showError && !file && (
            <>
              <Subtext>
                Choose the file you'd like to import. Minecraft Manager suports <b>.mcjprofile</b>, <b>Twitch zips</b>,
                and <b>MultiMC zips</b>.
              </Subtext>
            </>
          )}

          {!updateState && !showError && (
            <ButtonContainer>
              <BTN onClick={this.clickCancel} color="transparent">
                Cancel
              </BTN>
              <BTN onClick={this.chooseFile} color="green">
                Choose a file
              </BTN>
            </ButtonContainer>
          )}

          {file && !updateState && !showError && (
            <>
              <Title>import</Title>
              <Subtext>
                Do you want to import the file <b>{path.basename(file)}</b>?
              </Subtext>
              <ButtonContainer>
                <BTN onClick={this.clickCancel} color="red">
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
                <BTN onClick={this.clickCancel} color="green">
                  close
                </BTN>
              </ButtonContainer>
            </>
          )}

          {updateState && !showError && (
            <>
              <Title>importing...</Title>
              <Subtext>{updateState}</Subtext>
              <Subtext>To check progress, open the Downloads viewer</Subtext>
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
