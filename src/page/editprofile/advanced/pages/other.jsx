import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import path from 'path';
import { Button, Detail } from '@theemeraldtree/emeraldui';
import { shell } from 'electron';

const Panel = styled.div`
  background-color: #2b2b2b;
  width: 400px;
  padding: 10px;
  margin-bottom: 5px;

  & > div {
    margin-top: 5px;
  }

  h3 {
    margin: 0;
  }

  button {
    margin-top: 5px;
    display: block;
    width: 285px;
    text-align: left;
  }
`;

export default function Other(args) {
  const profile = args.profile;

  return (
    <>
      <Panel>
        <h3>Advanced Info</h3>
        <Button color="red" onClick={() => profile.openGameDir()}>
          open profile folder
        </Button>

        <Detail>internal id: {profile.id}</Detail>
        <Detail>version-safe name: {profile.safename}</Detail>
        <Detail>version timestamp: {profile.version.timestamp}</Detail>
        <Detail>OMAF version: {profile.omafVersion}</Detail>
      </Panel>
      <Panel>
        <h3>Technical Functions</h3>
        <Button color="red" onClick={() => shell.openExternal(path.join(profile.profilePath, '/profile.json'))}>
          open profile.json
        </Button>
        <Button
          color="red"
          onClick={() => shell.openExternal(path.join(profile.profilePath, '/_omaf/subAssets/mods.json'))}
        >
          open subAssets/mods.json
        </Button>
        <Button
          color="red"
          onClick={() => shell.openExternal(path.join(profile.profilePath, '/_omaf/subAssets/resourcepacks.json'))}
        >
          open subAssets/resourcepacks.json
        </Button>
        <Button
          color="red"
          onClick={() => shell.openExternal(path.join(profile.profilePath, '/_omaf/subAssets/worlds.json'))}
        >
          open subAssets/worlds.json
        </Button>
        <Button color="red" onClick={() => shell.openExternal(profile.profilePath)}>
          open OMAF data folder
        </Button>
      </Panel>
    </>
  );
}

Other.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  profile: PropTypes.object
};
