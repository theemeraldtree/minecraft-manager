import React from 'react';
import styled from 'styled-components';
import logo from './logo.png';
import Button from '../button/button';
const BG = styled.div`
    width:120px;
    height: 190px;
    background-color: #717171;
    display: inline-flex;
    margin: 5px;
    align-items: center;
    flex-flow: column;
    cursor: pointer;
    user-select: none;
    transition: 150ms;
    position: relative;
    &:hover {
        background-color: #5b5b5b;
    }
`

const Image = styled.div`
    background-image: url('${logo}');
    width: 100%;
    height: 80px;
    background-size: contain;
    background-repeat: no-repeat;
    margin-top: 5px;
    background-position: center;
`

const Title = styled.p`
    color: white;
    font-weight: bolder;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    margin: 5px 2px;
    user-select: none;
`

const Buttons = styled.div`
    display: flex;
    flex-flow: row;
    bottom: 3px;
    position: absolute;
`

const LaunchButton = styled(Button)`
    padding-top: 6px;
    padding-bottom: 6px;
`

const EditButton = styled(Button)`
    padding: 6px 0 6px 0;
    width: 40px;
    margin-left: 3px;
    text-align: center;
`

const ProfileCard = () => (
    <BG>
        <Image />
        <Title>Minecraft Manager is great!!</Title>
        <Buttons>
            <LaunchButton color='green'>launch</LaunchButton>
            <EditButton color='yellow'>edit</EditButton>
        </Buttons>
    </BG>
)

export default ProfileCard;