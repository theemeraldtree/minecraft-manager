import React, { useState } from 'react';
import styled from 'styled-components';
import logo from '../../../img/logo-sm.png';
import { ipcRenderer } from 'electron';
import Button from '../../../component/button/button';
import Section from '../components/section';
import NeedHelp from '../components/needhelp';
import Global from '../../../util/global';

const AboutTop = styled.div`
    display: flex;
    align-items: center;
    padding: 10px;
    padding-top: 30px;
    position: relative;
    h1 {
        color: white;
        margin: 0;
        font-size: 17pt;
    }
    h3 {
        color: #e6e6e6;
        margin: 0;
        font-weight: thin;
        font-size: 13pt;
    }
    background-color: grey;
`

const AboutBottom = styled.div`
    color: white;
    a {
        color: #42b3f5;
        text-decoration: none;
    }
`

const Logo = styled.div`
    width: 80px;
    height: 80px;
    margin-bottom: 65px;
    background-image: url(${logo});
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
`


const Updates = styled.div`
    margin-top: 10px;
    height: 65px;
    h3 {
        font-size: 12pt;
    }
`

export default function About() {

    const [ updateDisabled, setUpdateDisabled ] = useState(false);
    const [ updateText, setUpdateText ] = useState('check for updates');
    const [ updateSubText, setUpdateSubText ] = useState('');


    const checkForUpdates = () => {
        if(updateText !== 'restart') {
            setUpdateDisabled(true);
            setUpdateText('checking for updates...');
            setUpdateSubText('');
            ipcRenderer.send('check-for-updates');

            ipcRenderer.on('update-available', () => {
                setUpdateDisabled(true);
                setUpdateText('downloading');
                setUpdateSubText('Update available. Downloading...');
            });

            ipcRenderer.on('update-downloaded', () => {
                setUpdateDisabled(false);
                setUpdateText('restart');
                setUpdateSubText('Restart to update');
            })

            ipcRenderer.on('error', () => {
                setUpdateDisabled(false);
                setUpdateText('check for updates');
                setUpdateSubText('Error checking for updates');
            })

            ipcRenderer.on('update-not-available', () => {
                setUpdateDisabled(false);
                setUpdateText('check for updates');
                setUpdateSubText('Update not available');
            })
        }else{
            ipcRenderer.send('install-update');
        }
    }

    return (
        <>
            <Section>
                <AboutTop>
                    <Logo />
                    <div>
                        <h1>About Minecraft Manager</h1>
                        <h3>Version {Global.MCM_VERSION}</h3>
                        <h3>released {Global.MCM_RELEASE_DATE}</h3>
                                       
                        <Updates>
                                <Button onClick={checkForUpdates} disabled={updateDisabled} color='green'>{updateText}</Button>
                                <h3>{updateSubText}</h3>
                        </Updates>     
                    </div>
                </AboutTop>
                <AboutBottom>
                    <h3><a href="https://github.com/stairman06/minecraft-manager/blob/master/LICENSE">Minecraft Manager is licensed under the GNU General Public License v3</a></h3>
                    <h3><a title="Minecraft Manager Source Code" href="https://github.com/stairman06/minecraft-manager">Minecraft Manager is an open source project created by stairman06</a></h3>
                    <h3><a title="OMAF Wiki and Documentation" href="https://github.com/stairman06/omaf/wiki">Minecraft Manager uses the open-source OMAF standard</a></h3>
                </AboutBottom>
            </Section>
            <NeedHelp />
            <Section>
                <h2>Credits</h2>
                <h3>Minecraft Manager is made possible thanks to:
                    <li><a href="https://electronjs.org/">Electron</a></li>
                    <li><a href="https://reactjs.org/">React</a></li> 
                    <li><a href="https://www.styled-components.com/">styled-components</a></li>
                    <li><a href="https://babeljs.io/">Babel</a></li>
                    <li><a href="https://webpack.js.org">Webpack</a></li>
                    <li><a href="https://eslint.org/">eslint</a></li>
                    <li><a href="https://github.com/isaacs/rimraf">rimraf</a></li>
                    <li><a href="https://github.com/request/request-promise">request-promise</a></li>
                    <li><a href="https://github.com/cthackers/adm-zip">adm-zip</a></li>
                    <li><a href="https://github.com/archiverjs/node-archiver">archiver</a></li>
                    <li><a href="https://github.com/vkbansal/react-contextmenu">react-contextmenu</a></li>
                    <li><a href="https://reacttraining.com/react-router/">react-router & react-router-dom</a></li>
                    <li><a href="https://github.com/oliver-moran/jimp">jimp</a></li>
                    <li><a href="https://github.com/apostrophecms/sanitize-html">sanitize-html</a></li>
                    <li><a href="https://fonts.google.com/specimen/Roboto">the Roboto font</a></li>
                    <li><a href="https://github.com/KyleAMathews/typefaces/tree/master/packages/roboto">typeface-roboto</a></li>
                    <li>other projects</li>
                    and of course, YOU! Thank you!</h3>
            </Section>
        </>
    )
}