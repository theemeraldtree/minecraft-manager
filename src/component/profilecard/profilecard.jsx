import React from 'react';
import styled from 'styled-components';
import Button from '../button/button';
import { withRouter } from 'react-router-dom';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import Global from '../../util/global';
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
    background-image: url('${props =>  props.src}');
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

const Wrapper = styled.div`
    .react-contextmenu-wrapper {
        display: inline-flex;
    }
    display: inline-flex;
    position: relative;
`

const StateOverlay = styled.div`
    width: 120px;
    height: 190px;
    position: absolute;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 2;
    margin: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    text-align: center;
    flex-flow: column;
`
const ProfileCard = ({profile, history, showDeletion}) => (
    <Wrapper>
        {profile.hosts.curse && !profile.hosts.curse.fullyInstalled && !profile.state && <StateOverlay><b>ERROR</b>   <br />Unfinished Curse Profile Install</StateOverlay>}
        {profile.state && <StateOverlay>{profile.state}</StateOverlay>}
        <ContextMenuTrigger id={`profilecard${profile.id}`}>
            <BG onClick={() => {history.push(`/profile/${profile.id}`)}}>
                <Image src={`${profile.iconpath}#${Global.cacheUpdateTime}`} />
                <Title>{profile.name}</Title>
                <Buttons>
                    <LaunchButton color='green' onClick={(e) => {e.stopPropagation();profile.launch();}}>launch</LaunchButton>
                    <EditButton color='yellow' onClick={(e) => {e.stopPropagation();history.push(`/edit/general/${profile.id}`);}}>edit</EditButton>
                </Buttons>
            </BG>
        </ContextMenuTrigger>
        <ContextMenu id={`profilecard${profile.id}`}>
            <MenuItem onClick={profile.launch}>Launch</MenuItem>
            <MenuItem onClick={() => {history.push(`/edit/general/${profile.id}`)}}>Edit</MenuItem>
            <MenuItem>Update</MenuItem>
            <MenuItem>Share</MenuItem>
            <MenuItem divider />
            <MenuItem onClick={() => {showDeletion(profile)}}>Delete</MenuItem>
        </ContextMenu>
    </Wrapper>
)

export default withRouter(ProfileCard);