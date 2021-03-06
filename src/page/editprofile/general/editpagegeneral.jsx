import React, { useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextInput, TextBox, Detail, Spinner, InputHolder, withTheme } from '@theemeraldtree/emeraldui';
import ProfilesManager from '../../../manager/profilesManager';
import Global from '../../../util/global';
import Overlay from '../../../component/overlay/overlay';
import ToastManager from '../../../manager/toastManager';
import ErrorManager from '../../../manager/errorManager';

const { dialog } = require('electron').remote;

const DescContainer = styled.div`
  margin-top: 20px;
  width: 100%;
`;

const Renaming = styled.div`
  background-color: #222;
  font-size: 21pt;
  width: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
`;

const LongDesc = styled(TextBox)`
  height: 400px;
  width: calc(100vw - 159px);
  max-width: 770px;
`;

const IconWrapper = styled.button`
  width: 150px;
  height: 150px;
  border: 0;
  background-color: #404040;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-flow: column;
  position: relative;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  
  div {
    width: 60px;
    text-align: center;
    position: absolute;
    bottom: 0;
  }

  &:focus-visible {
    outline: 2px solid yellow;
  }

  &:disabled {
    filter: brightness(0.75);
    cursor: not-allowed;
  }
`;

const ResetIconButton = styled(Button)`
  && {
    width: 150px;
    padding: 11.5px 0;
    text-align: center;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
`;

const Icon = styled.img`
  width: auto;
  height: auto;
  max-width: 150px;
  max-height: 150px;
  flex-shrink: 0;
`;

const AboutContainer = styled.div`
  display: flex;
  margin-right: 10px;
`;

const AboutRight = styled.div`
  overflow-x: hidden;
  margin-left: 10px;

  > div:nth-child(2) {
    margin-top: 10px;
    width: 100vw;
    max-width: 600px;
  }

  textarea {
    width: calc(100vw - 319px);
    max-width: 600px;
    max-height: 107px;
  }

  input {
    width: calc(100vw - 400px);
    max-width: 527px;
  }
`;

const EditPageGeneral = ({ id, history, theme }) => {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [profile] = useState(ProfilesManager.getProfileFromID(id));
  const [nameValue, setNameValue] = useState(profile.name);
  const [nameDisabled, setNameDisabled] = useState(true);
  const [renaming, setRenaming] = useState(false);

  const nameChange = e => {
    const newName = e.target.value;
    let namedisable = true;
    if (newName !== profile.name && newName.trim() !== '' && !ProfilesManager.containsProfileWithName(newName)) {
      namedisable = false;
    }
    setNameValue(e.target.value);
    setNameDisabled(namedisable);
  };

  const blurbChange = e => {
    profile.blurb = e.target.value;
    profile.save();
  };

  const descChange = e => {
    profile.description = e.target.value;
    profile.save();
  };

  const changeIcon = () => {
    const p = dialog.showOpenDialogSync({
      title: 'Select your image file',
      buttonLabel: 'Choose image',
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] }],
      properties: ['openFile']
    });

    if (p && p[0]) {
      const img = p[0];
      profile.setIcon(img);
      ProfilesManager.updateProfile(profile);
      Global.updateCache();
      forceUpdate();
    }
  };

  const confirmNameChange = () => {
    setNameDisabled(true);
    setRenaming(true);
    profile
      .rename(nameValue)
      .then(prof => {
        history.push(`/edit/general/${prof.id}`);

        // *unfortunately* a page reload is required to my knowledge
        // react-router doesn't want to refresh the page otherwise
        window.location.reload();
      })
      .catch(err => {
        setNameValue(profile.name);
        setNameDisabled(false);
        setRenaming(false);
        ToastManager.createToast('Error Renaming', ErrorManager.makeReadable(err, 'renaming'));
      });
  };

  const resetIcon = () => {
    profile.resetIcon();
    ProfilesManager.updateProfile(profile);
    forceUpdate();
  };

  return (
    <>
      {renaming && (
        <>
          <Overlay force>
            <Renaming>
              <Spinner />
            </Renaming>
          </Overlay>
        </>
      )}
      {!renaming && (
        <>
          <>
            <AboutContainer>
              <div>
                <Detail>Icon</Detail>
                <IconWrapper disabled={profile.isDefaultProfile} onClick={changeIcon}>
                  <Icon src={`file:///${profile.iconPath}#${new Date().getTime()}`} />
                </IconWrapper>
                <ResetIconButton disabled={profile.isDefaultProfile} onClick={resetIcon} color="#555">
                  Reset Icon
                </ResetIconButton>
              </div>
              <AboutRight>
                <div>
                  <Detail>Name</Detail>
                  <InputHolder text>
                    <TextInput
                      disabled={profile.isDefaultProfile}
                      value={nameValue}
                      onChange={nameChange}
                      placeholder="Enter a name"
                    />
                    <Button onClick={confirmNameChange} disabled={nameDisabled} color="#777">
                      Confirm
                    </Button>
                  </InputHolder>
                </div>
                <div>
                  <DescContainer>
                    <Detail>Summary</Detail>
                    <TextBox
                      defaultValue={profile.blurb}
                      onChange={blurbChange}
                      disabled={profile.isDefaultProfile}
                      placeholder="Enter a short description"
                    />
                  </DescContainer>
                </div>
              </AboutRight>
            </AboutContainer>

            <DescContainer>
              <Detail>Description</Detail>
              <LongDesc
                defaultValue={profile.description}
                onChange={descChange}
                disabled={profile.isDefaultProfile}
                placeholder="Enter a long description"
                theme={theme}
              />
            </DescContainer>
          </>
        </>
      )}
    </>
  );
};

EditPageGeneral.propTypes = {
  id: PropTypes.string.isRequired,
  history: PropTypes.shape({
    push: PropTypes.func
  }).isRequired,
  theme: PropTypes.object
};

export default withTheme(withRouter(EditPageGeneral));
