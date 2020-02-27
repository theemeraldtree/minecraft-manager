import React from 'react';
import styled from 'styled-components';
import ProfilesManager from '../../../manager/profilesManager';
import Button from '../../../component/button/button';
import Detail from '../../../component/detail/detail';
import path from 'path';

import { remote } from 'electron';

const BG = styled.div`
    div {
        margin-bottom: 5px;
        display: block;
    }
`

export default function EditPageAdvanced({ id }) {
    const profile = ProfilesManager.getProfileFromID(id);

    return (
        <BG>
            <Button color='red' onClick={() => remote.shell.openExternal(path.join(profile.profilePath, '/profile.json'))}>Open profile.json</Button>
            <Button color='red' onClick={profile.openGameDir}>View Profile Folder</Button>
            <Detail>internal id: {profile.id}</Detail>
            <Detail>version-safe name: {profile.safename}</Detail>
            <Detail>version timestamp: {profile.version.timestamp}</Detail>
        </BG>
    )   
}