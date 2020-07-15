import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { ContextMenu, MenuItem, ContextMenuTrigger, SubMenu } from 'react-contextmenu';
import { shell } from 'electron';
import { Button } from '@theemeraldtree/emeraldui';
import Global from '../../util/global';
import edit from './img/edit.png';
import launch from './img/launch.png';
import FluentHover from '../../util/fluentHover';

const BG = styled.div`
  width: 120px;
  height: 190px;
  background-color: #404040;
  display: inline-flex;
  margin: 3px;
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
  &:hover,
  &:focus,
  &:focus-within {
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
  height: 120px;
  width: 120px;
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
  left: 1.5px;
  right: 0;
  padding-left: 2px;
  padding-right: 2px;
`;

const LaunchButton = styled(Button)`
  && {
    img {
      width: 20px;
    }
    width: 80px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2px;
  }
`;

const EditButton = styled(Button)`
  && {
    img {
      width: 20px;
    }
    
  padding: 3px;
  padding-left: 0;
  padding-right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 3px;
  width: 30px;
  text-align: center;
  }
`;

const Wrapper = styled.div`
  .react-contextmenu-wrapper {
    display: inline-flex;
  }
  display: inline-flex;
  position: relative;
`;

const StateOverlay = styled.div`
  width: 120px;
  height: 190px;
  position: absolute;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 2;
  margin: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  flex-flow: column;
`;

const ProfileCard = ({ profile, history, showDeletion, showShare, showUpdate, showLaunching, hideLaunching }) => {
  const ref = React.createRef();
  return (
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
          ref={ref}
          onMouseMove={e => FluentHover.mouseMove(e, ref, '#5b5b5b', true)}
          onMouseLeave={() => FluentHover.mouseLeave(ref, '#404040')}
          onClick={() => {
            history.push(`/profile/${profile.id}`);
          }}
        >
          <Image src={`file:///${profile.iconPath}#${Global.cacheUpdateTime}`} />
          <Title>{profile.name}</Title>
          <Buttons className="buttons">
            <LaunchButton
              color="green"
              onClick={async e => {
                e.stopPropagation();
                showLaunching();
                await profile.launch();
                hideLaunching();
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
            <SubMenu title="Edit" hoverDelay={0} onClick={() => history.push(`/edit/general/${profile.id}`)}>
              <MenuItem onClick={() => history.push(`/edit/general/${profile.id}`)}>General</MenuItem>
              {!profile.isDefaultProfile && (
                <>
                  <MenuItem onClick={() => history.push(`/edit/versions/${profile.id}`)}>Version</MenuItem>
                  <MenuItem onClick={() => history.push(`/edit/mods/${profile.id}`)}>Mods</MenuItem>
                </>
              )}
              <MenuItem onClick={() => history.push(`/edit/worlds/${profile.id}`)}>Worlds</MenuItem>
              <MenuItem onClick={() => history.push(`/edit/resourcepacks/${profile.id}`)}>Resource Packs</MenuItem>
              <MenuItem onClick={() => history.push(`/edit/advanced/${profile.id}`)}>Settings</MenuItem>
            </SubMenu>

            {!profile.isDefaultProfile && (
              <>
                <MenuItem onClick={() => showUpdate(profile)}>Update</MenuItem>
                <MenuItem onClick={() => showShare(profile)}>Share</MenuItem>
              </>
            )}
          </>
        )}
        {profile.state !== 'installing' && !profile.isDefaultProfile && (
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
              onClick={() =>
                shell.openExternal(`https://curseforge.com/minecraft/modpacks/${profile.hosts.curse.slug}`)
              }
            >
              View on CurseForge
            </MenuItem>
          </>
        )}
      </ContextMenu>
    </Wrapper>
  );
};

ProfileCard.propTypes = {
  profile: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  showDeletion: PropTypes.func,
  showShare: PropTypes.func,
  showUpdate: PropTypes.func,
  showLaunching: PropTypes.func,
  hideLaunching: PropTypes.func
};

export default withRouter(ProfileCard);
