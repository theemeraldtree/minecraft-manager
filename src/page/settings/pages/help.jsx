/* eslint-disable */
import React, { useState } from 'react';
import styled from 'styled-components';
import NeedHelp from '../components/needhelp';
import Section from '../components/section';
import Button from '../../../component/button/button';
import Confirmation from '../../../component/confirmation/confirmation';
import LibrariesManager from '../../../manager/librariesManager';
import VersionsManager from '../../../manager/versionsManager';
import LauncherManager from '../../../manager/launcherManager';
const List = styled.div`
    display: flex;
    flex-flow: column;
    div {
        margin-top: 3px;
        width: auto;
    }
`

export default function Help() {
    const [ showPopup, setShowPopup ] = useState(false);
    const [ action, setAction ] = useState('');
    const confirmAction = () => {
        setShowPopup(false);
        switch(action) {
            case 'clean-launcher-profiles':
                LauncherManager.cleanMinecraftProfiles();
                break;
            case 'clean-launcher-libraries':
                LibrariesManager.cleanLibraries();
                break;
            case 'clean-launcher-versions':
                VersionsManager.cleanVersions();
                break;
        }
    }
    const prepareAction = (action) => {
        setAction(action);
        setShowPopup(true);
    }
    return (
        <>
            
            {showPopup && <Confirmation cancelDelete={() => setShowPopup(false)} confirmDelete={confirmAction}>
                <h1>This can be dangerous!</h1>
                <h3>Are you sure? This is a potentially dangerous operation that can screw up your game!</h3>
            </Confirmation>}
            <NeedHelp />
            <Section>
                <h2>Advanced Troubleshooting Functions</h2>
                <h3><b>Warning!</b> These are advanced functions that, if used wrong, can seriously screw up your game! Proceed with caution!</h3>
                <List>
                    <Button onClick={() => prepareAction('clean-launcher-profiles')} color='red'>clean launcher profiles</Button>
                    <Button onClick={() => prepareAction('clean-launcher-libraries')} color='red'>clean launcher libraries</Button>
                    <Button onClick={() => prepareAction('clean-launcher-versions')} color='red'>clean launcher versions</Button>
                </List>
            </Section>
        </>
    )
}