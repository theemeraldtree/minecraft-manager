import styled from 'styled-components';
import React from 'react';
import Colors from '../../style/colors';
const Wrapper = styled.div`
    position: relative;
    padding: 5px;
    margin-top: 30px;
    border-radius: 13px;
    width: 70vw;
    margin-left: 70px;
    background-color: ${Colors.card};
`
const IconWrapperHolder = styled.div`
    display: inline-block;
    height: 118px;
    width: 118px;
`
const IconWrapper = styled.div`
    height: 118px;
    width: 118px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #282828;
    border-radius: 13px;
`
const Icon = styled.img`
    width: 100%;
    border-radius: 13px;
`
const Title = styled.p`
    display: inline-block;
    width: 80%;
    position: absolute;
    font-size: 33pt;
    padding-left: 10px;
    font-weight: bolder;
    line-height: 118px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: white;
    margin: 0;
`
const MCVersions = styled.p`
    color: white;
    display: inline-block;
    position: absolute;
    font-size: 13pt;
    padding-left: 10px;
    line-height: 190px;
    width: 55vw;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
`
const ViewCurseButton = styled.a`
    position: absolute;
    right: 10px;
    top: 10px;
    background-color: green;
    padding: 10px;
    border-radius: 13px;
    color: white;
    cursor: pointer;
    transition: 150ms;
    text-decoration: none;
    &:hover {
        background-color: darkgreen;
        transition: 150ms;
    }
`
const ModInfo = ({icon, mcVersions, curseURL, name}) => (
    <Wrapper>
        <IconWrapperHolder>
            <IconWrapper>
                <Icon src={icon} />
            </IconWrapper>
        </IconWrapperHolder>
        <Title>{name}</Title>
        <MCVersions title={`Minecraft Version ${mcVersions.join(', ')}`} className='mcversions'>Available for Minecraft Versions {mcVersions.join(', ')}</MCVersions>
        {curseURL && 
            <ViewCurseButton target='__blank' href={curseURL}>View on CurseForge</ViewCurseButton>
        }
    </Wrapper>
);

export default ModInfo;