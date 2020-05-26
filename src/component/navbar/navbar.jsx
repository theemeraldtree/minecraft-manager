import React from 'react';
import styled from 'styled-components';
import { NavLink, Link } from 'react-router-dom';
import os from 'os';
import Downloads from './downloads/downloads';
import settingsImage from '../windowbar/img/settings.png';

const BG = styled.div`
  width: 80px;
  min-width: 80px;
  height: 100%;
  background-color: #1c1c1c;
  flex: 0 1 auto;
`;

const CLink = styled(NavLink)`
  width: 100%;
  display: block;
  height: min-content;
  text-align: center;
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
    font-weight: 900;
  }
  outline-offset: -2px;
  margin-bottom: 20px;
  transition: font-weight 150ms;
`;

const Links = styled.div`
  margin-top: 30px;
`;

const Settings = styled(Link)`
  width: 20px;
  height: 20px;
  background-image: url(${settingsImage});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  position: absolute;
  bottom: 100px;
  left: 30px;
`;

const Navbar = () => (
  <BG>
    <Links>
      <CLink exact to="/" activeClassName="active">
        profiles
      </CLink>
      <CLink to="/discover" activeClassName="active">
        discover
      </CLink>
    </Links>
    {os.platform() === 'linux' && <Settings to="/settings" />}
    <Downloads />
  </BG>
);

export default Navbar;
