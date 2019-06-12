import React from 'react';
import styled from 'styled-components';
import Button from '../button/button';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
const BG = styled.div`
    margin-top: 5px;
    width:100%;
    height: 90px;
    background-color: #717171;
    display: inline-flex;
    user-select: none;
    transition: 150ms;
    position: relative;
    overflow: hidden;
    ${props => !props.disableHover && `
        cursor: pointer;
        &:hover {
            background-color: #5b5b5b;
        }
    `}
`

const Image = styled.div`
    background-image: url('${props =>  props.src}');
    width: 80px;
    height: 80px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    flex-shrink: 0;
    margin: 5px;
`

const Title = styled.p`
    color: white;
    font-weight: bolder;
    font-size: 22pt;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 5px 2px;
    margin-bottom: 0;
    user-select: none;
    display: inline-block;
    white-space: nowrap;
`

const Version = styled.p`
    color: white;
    font-weight: bolder;
    font-size: 13pt;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 5px;
    margin-top: 0;
    user-select: none;
    ${props => props.buttonShown && `
        margin-right: 80px;
    `}
`

const Buttons = styled.div`
    display: flex;
    flex-flow: row;
    right: 10px;
    bottom: 10px;
    position: absolute;
`

const Details = styled.div`
    display: flex;
    justify-content: center;
    flex-flow: column;
    overflow: hidden;
`

const ModCard = ({mod, onClick, showDelete, showInstall, disableHover, installed, installClick, deleteClick, showBlurb}) => (
    <>
        <ContextMenuTrigger id={`mod${mod.id}`}>
            <BG disableHover={disableHover} data-cachedid={mod.cachedID} onClick={onClick}>
                <Image src={mod.iconpath} />
                <Details>
                    <Title>{mod.name}</Title>
                    <Version buttonShown={showInstall || showDelete}>{!showBlurb && 'versionname'}{showBlurb && mod.blurb}</Version>
                </Details>
                <Buttons>
                    {showDelete && 
                    <Button onClick={deleteClick} color='red'>delete</Button>
                    }

                    {showInstall && installed &&
                    <Button disabled color='green'>installed</Button>
                    }

                    {showInstall && !installed &&
                    <Button color='green' onClick={installClick}>install</Button>
                    }
                </Buttons>
            </BG>
        </ContextMenuTrigger>
        <ContextMenu id={`mod${mod.id}`}>
            <MenuItem>Install</MenuItem>
            <MenuItem>Share</MenuItem>
            <MenuItem>Details</MenuItem>
        </ContextMenu>
    </>
)

export default ModCard;