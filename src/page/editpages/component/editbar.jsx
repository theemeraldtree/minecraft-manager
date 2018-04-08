import React from 'react';
import { NavLink } from 'react-router-dom';
import Profile from '../../../util/profile';
import styled from 'styled-components';
const Wrapper = styled.div`
    box-shadow: 10px 0 28px 0 rgba(0, 0, 0, 0.55);
    z-index: 10;
    height: 100%;
    display: inline-block;
    flex-shrink: 0;
    overflow-x: hidden;
    overflow-y: scroll;
    width: 25%;
    max-width: 200px;
    &::-webkit-scrollbar {
        display: none;
    }
    background: #363636;
`
const ImgWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
`
const Icon = styled.img`
    width: 100%;
    display: block;
    display: inline-block;
    position: relative;
`
const ProfileName = styled.p`
    text-align: center;
    font-size: 16pt;
    padding: 0 5px 0 5px;
    margin: 0;
    font-weight: bolder;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
    overflow: hidden;
    color: white;
`
const Button = styled(NavLink)`
    width: 100%;
    height: 38px;
    background: #444444;
    text-align: center;
    vertical-align: middle;
    line-height: 38px;
    text-decoration: none;
    display: block;
    margin: 0 auto;
    margin-top: 12px;
    font-weight: bolder;
    font-size: 12pt;
    color: white;
    &.active {
        background: #003663;
    }
`
const EditBar = ({profile}) => (
    <Wrapper>
        <ImgWrapper>
            <Icon src={profile.icon} />
        </ImgWrapper>
        <ProfileName title={profile.name ? profile.name : 'Loading...'}>{profile.name ? profile.name : 'Loading...'}</ProfileName>
        <Button to={`/profiles/edit/${profile.id}/settings`}>Settings</Button>
        <Button to={`/profiles/edit/${profile.id}/mods`}>Mods</Button>
        <Button to={`/profiles/edit/${profile.id}/versions`}>Versions</Button>
        <Button to={`/profiles/edit/${profile.id}/resourcepacks`}>Resource Packs</Button>
        <Button to={`/profiles/edit/${profile.id}/maps`}>Maps</Button>
        <Button to={`/profiles/edit/${profile.id}/advanced`}>Advanced</Button>
    </Wrapper>
);

EditBar.propTypes= {
    profile: Profile
}

export default EditBar;