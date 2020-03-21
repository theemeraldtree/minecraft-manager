import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import path from 'path';
import { shell } from 'electron';
import ProfilesManager from '../../../manager/profilesManager';
import Button from '../../../component/button/button';
import Detail from '../../../component/detail/detail';

const BG = styled.div`
  button {
    margin-bottom: 5px;
    display: block;
  }
`;

export default function EditPageAdvanced({ id }) {
  const profile = ProfilesManager.getProfileFromID(id);

  return (
    <BG>
      <Button color="red" onClick={() => shell.openExternal(path.join(profile.profilePath, '/profile.json'))}>
        Open profile.json
      </Button>
      <Button
        color="red"
        onClick={() => shell.openExternal(path.join(profile.profilePath, '/_omaf/subAssets/mods.json'))}
      >
        Open subAssets/mods.json
      </Button>
      <Button
        color="red"
        onClick={() => shell.openExternal(path.join(profile.profilePath, '/_omaf/subAssets/resourcepacks.json'))}
      >
        Open subAssets/resourcepacks.json
      </Button>
      <Button
        color="red"
        onClick={() => shell.openExternal(path.join(profile.profilePath, '/_omaf/subAssets/worlds.json'))}
      >
        Open subAssets/worlds.json
      </Button>

      <Button color="red" onClick={profile.openGameDir}>
        View Profile Folder
      </Button>
      <Button color="red" onClick={() => shell.openExternal(profile.profilePath)}>
        Open OMAF data folder
      </Button>
      <Detail>internal id: {profile.id}</Detail>
      <Detail>version-safe name: {profile.safename}</Detail>
      <Detail>version timestamp: {profile.version.timestamp}</Detail>
      <Detail>OMAF version: {profile.omafVersion}</Detail>
    </BG>
  );
}

EditPageAdvanced.propTypes = {
  id: PropTypes.string.isRequired
};
