import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu';
import { remote } from 'electron';
import path from 'path';
import Global from '../../../util/global';
import ProfilesManager from '../../../manager/profilesManager';
import FluentHover from '../../../util/fluentHover';

const BG = styled.div`
  height: 100%;
  position: absolute;
  background-color: #2b2b2b;
  width: 120px;
`;

const ItemBase = styled(NavLink)`
  width: calc(100% - 5px);
  display: block;
  height: 25px;
  color: white;
  text-decoration: none;
  font-size: 12pt;
  font-weight: 400;
  &.active,
  &.active:hover {
    filter: brightness(1);
    background: #424242 !important;
  }
  margin-bottom: 0;
  margin-top: 0;
  padding-top: 10px;
  padding-bottom: 4px;
  padding-left: 5px;
  transition: background 150ms;
  outline-offset: -2px;
`;

const Item = ({ to, children }) => {
  const ref = React.createRef();
  return (
    <ItemBase
      activeClassName="active"
      to={to}
      ref={ref}
      onMouseMove={e => FluentHover.mouseMove(e, ref, '#363636')}
      onMouseLeave={() => FluentHover.mouseLeave(ref, '#2b2b2b')}
    >
      {children}
    </ItemBase>
  );
};

Item.propTypes = {
  to: PropTypes.string,
  children: PropTypes.any
};

const Sidebar = ({ id, isDefaultProfile }) => (
  <BG>
    <Item to={`/edit/general/${id}`}>
      General
    </Item>
    {!isDefaultProfile && (
      <>
        <Item to={`/edit/version/${id}`}>
          Version
        </Item>
        <ContextMenuTrigger holdToDisplay={-1} id="editsidebarmods">
          <Item to={`/edit/mods/${id}`}>
            Mods
          </Item>
        </ContextMenuTrigger>
      </>
    )}
    <ContextMenuTrigger holdToDisplay={-1} id="editsidebarworlds">
      <Item to={`/edit/worlds/${id}`}>
        Worlds
      </Item>
    </ContextMenuTrigger>
    <ContextMenuTrigger holdToDisplay={-1} id="editsidebarresourcepacks">
      <Item to={`/edit/resourcepacks/${id}`}>
        Resource Packs
      </Item>
    </ContextMenuTrigger>
    <Item to={`/edit/settings/${id}`}>
      Settings
    </Item>

    <ContextMenu id="editsidebarmods">
      <MenuItem
        onClick={() => {
          remote.shell.openExternal(path.join(Global.PROFILES_PATH, `/${id}/files/mods`));
        }}
      >
        Open Mods Folder
      </MenuItem>
      <MenuItem onClick={() => ProfilesManager.getProfileFromID(id).refreshSubAsset('mods')}>Refresh Mods</MenuItem>
    </ContextMenu>

    <ContextMenu id="editsidebarworlds">
      <MenuItem
        onClick={() => {
          remote.shell.openExternal(path.join(Global.PROFILES_PATH, `/${id}/files/saves`));
        }}
      >
        Open Worlds Folder
      </MenuItem>
      <MenuItem onClick={() => ProfilesManager.getProfileFromID(id).refreshSubAsset('worlds')}>Refresh Worlds</MenuItem>
    </ContextMenu>

    <ContextMenu id="editsidebarresourcepacks">
      <MenuItem
        onClick={() => {
          remote.shell.openExternal(path.join(Global.PROFILES_PATH, `/${id}/files/resourcepacks`));
        }}
      >
        Open Resource Packs Folder
      </MenuItem>
      <MenuItem onClick={() => ProfilesManager.getProfileFromID(id).refreshSubAsset('resourcepacks')}>
        Refresh Resource Packs
      </MenuItem>
    </ContextMenu>
  </BG>
);

Sidebar.propTypes = {
  id: PropTypes.string.isRequired,
  isDefaultProfile: PropTypes.bool
};

export default Sidebar;
