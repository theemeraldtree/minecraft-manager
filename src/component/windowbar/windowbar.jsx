import React from 'react';
import styled from 'styled-components';
import os from 'os';
import ActionButtons from './action-buttons';

const Wrapper = styled.div`
    flex: 0 1 29px;
    height: 29px;
    background-color: #1D1D1D;
    width: 100vw;
    -webkit-app-region: drag;
    z-index: 1000;
    display: block;
    user-select: none;
    ${os.platform() === 'darwin' && `
        height: 23px;
        flex: 0 1 23px;
        display: flex;
        justify-content: center;   
        align-items: center;
    `}
`

const Title = styled.p`
    position: absolute;
    color: white;
    top: 5px;
    left: 5px;
    font-weight: thin;
    margin: 0;
    width: 150px;
    -webkit-app-region: drag;
    cursor: default;
    ${os.platform() === 'darwin' && `
        text-align: center;
        top: 0;
        position: initial;
    `}
`


let WindowBar = () => (
    <Wrapper>
        <Title>Minecraft Manager</Title>
        <ActionButtons />
    </Wrapper>
)

export default WindowBar;