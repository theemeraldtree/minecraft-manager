import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

const BG = styled.div`
  height: 100%;
  position: absolute;
  background-color: #2b2b2b;
  width: 120px;
`;

const Item = styled(NavLink)`
  width: calc(100% - 5px);
  display: block;
  height: 25px;
  color: white;
  text-decoration: none;
  font-size: 12pt;
  font-weight: 400;
  &:hover {
    filter: brightness(0.75);
  }
  &.active,
  &.active:hover {
    filter: brightness(1);
    background: #424242;
  }
  margin-bottom: 0;
  margin-top: 0;
  padding-top: 10px;
  padding-bottom: 4px;
  padding-left: 5px;
  transition: background 150ms;
`;

const Sidebar = ({ id, isDefaultProfile }) => (
  <BG>
    <Item to={`/edit/general/${id}`} activeClassName="active">
      general
    </Item>
    {!isDefaultProfile && (
      <>
        <Item to={`/edit/versions/${id}`} activeClassName="active">
          versions
        </Item>
        <Item to={`/edit/mods/${id}`} activeClassName="active">
          mods
        </Item>
      </>
    )}
    <Item to={`/edit/worlds/${id}`} activeClassName="active">
      worlds
    </Item>
    <Item to={`/edit/resourcepacks/${id}`} activeClassName="active">
      resource packs
    </Item>
    <Item to={`/edit/advanced/${id}`} activeClassName="active">
      advanced
    </Item>
  </BG>
);

Sidebar.propTypes = {
  id: PropTypes.string.isRequired,
  isDefaultProfile: PropTypes.bool
};

export default Sidebar;
