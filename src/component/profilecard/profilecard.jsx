import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import { shell } from 'electron';
import Global from '../../util/global';
import edit from './img/edit.png';
import launch from './img/launch.png';
import Button from '../button/button';

const BG = styled.div`
  width: 110px;
  height: 180px;
  background-color: #404040;
  display: inline-flex;
  margin: 5px;
  align-items: center;
  flex-flow: column;
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: 100ms;
  .buttons {
    transition: 100ms;
    bottom: -40px;
  }
  overflow: hidden;
  &:hover {
    background-color: #5b5b5b;
    .buttons {
      bottom: 3px;
    }
  }
`;

const Image = styled.div.attrs(props => ({
  style: {
    backgroundImage: `url('${props.src.replace(/\\/g, '/')}')`
  }
}))`
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  height: 110px;
  width: 110px;
  flex-shrink: 0;
`;

const Title = styled.p`
  color: white;
  font-weight: bolder;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  margin: 5px 2px;
  user-select: none;
  max-width: 120px;
  font-size: 11pt;
`;

const Buttons = styled.div`
  display: flex;
  flex-flow: row;
  bottom: 3px;
  position: absolute;
  left: 0;
  right: 0;
  padding-left: 2px;
  padding-right: 2px;
`;

const LaunchButton = styled(Button)`
  img {
    width: 20px;
  }
  width: 70px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px;
`;

const EditButton = styled(Button)`
  padding: 3px;
  padding-left: 0;
  padding-right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    width: 20px;
  }
  margin-left: 3px;
  width: 30px;
  text-align: center;
`;

const Wrapper = styled.div`
  .react-contextmenu-wrapper {
    display: inline-flex;
  }
  display: inline-flex;
  position: relative;
`;

const StateOverlay = styled.div`
  width: 110px;
  height: 180px;
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
`;

const ProfileCard = ({ profile, history, showDeletion, showShare, showUpdate }) => (
  <Wrapper>
    <ContextMenuTrigger holdToDisplay={-1} id={`profilecard${profile.id}`}>
      {profile.hosts.curse && !profile.hosts.curse.fullyInstalled && !profile.state && (
        <StateOverlay>
          <b>ERROR</b> <br />
          Unfinished Curse Profile Install
        </StateOverlay>
      )}
      {profile.state && <StateOverlay>{profile.state}</StateOverlay>}
      <BG
        onClick={() => {
          history.push(`/profile/${profile.id}`);
        }}
      >
        <Image src={`file:///${profile.iconPath}#${Global.cacheUpdateTime}`} />
        <Title>{profile.name}</Title>
        <Buttons className="buttons">
          <LaunchButton
            color="green"
            onClick={e => {
              e.stopPropagation();
              profile.launch();
            }}
          >
            <img alt="Launch" src={launch} />
          </LaunchButton>
          <EditButton
            color="yellow"
            onClick={e => {
              e.stopPropagation();
              history.push(`/edit/general/${profile.id}`);
            }}
          >
            <img alt="Launch" src={edit} />
          </EditButton>
        </Buttons>
      </BG>
    </ContextMenuTrigger>
    <ContextMenu holdToDisplay={-1} id={`profilecard${profile.id}`}>
      {!profile.error && profile.state !== 'installing' && (
        <>
          <MenuItem onClick={() => profile.launch()}>Launch</MenuItem>

          {!profile.isDefaultProfile && (
            <>
              <MenuItem onClick={() => history.push(`/edit/general/${profile.id}`)}>Edit</MenuItem>
              <MenuItem onClick={() => showUpdate(profile)}>Update</MenuItem>
              <MenuItem onClick={() => showShare(profile)}>Share</MenuItem>
            </>
          )}
        </>
      )}
      {profile.state !== 'installing' && (
        <MenuItem
          onClick={() => {
            showDeletion(profile);
          }}
        >
          Delete
        </MenuItem>
      )}
      {!profile.error && profile.state !== 'installing' && (
        <>
          <MenuItem divider />
          <MenuItem onClick={() => profile.openGameDir()}>Open Profile Folder</MenuItem>
        </>
      )}
      {!profile.error && profile.state !== 'installing' && profile.hosts.curse && (
        <>
          <MenuItem
            onClick={() => shell.openExternal(`https://curseforge.com/minecraft/modpacks/${profile.hosts.curse.slug}`)}
          >
            View on CurseForge
          </MenuItem>
        </>
      )}
    </ContextMenu>
  </Wrapper>
);

ProfileCard.propTypes = {
  profile: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  showDeletion: PropTypes.func,
  showShare: PropTypes.func,
  showUpdate: PropTypes.func
};

export default withRouter(ProfileCard);
