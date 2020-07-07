import React from 'react';
import fs from 'fs';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import Downloads from './downloads/downloads';
import Global from '../../util/global';
import logo from '../../img/logo-sm.png';
import instances from './instances.png';
import discover from './discover.png';
import settings from './settings.png';

const Container = styled.div`
  width: 100%;
  height: 45px;
  background-color: #131517;
  display: flex;
  align-items: center;
  -webkit-app-region: drag;
`;

const Logo = styled.img`
  width: 32px;
  height: 32px;
  margin-left: 3px;
`;

const PageLink = styled(NavLink)`
  width: 33px;
  height: 33px;
  height: min-content;
  text-align: center;
  color: white;
  text-decoration: none;
  font-size: 12pt;
  font-weight: 400;
  outline-offset: -2px;
  transition: font-weight 150ms;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  filter: brightness(0.75);
  margin-left: 5px;
  -webkit-app-region: no-drag;
  
  &.active {
    filter: brightness(1);
    font-weight: 900;
    background: #2C2C2C;
  }

  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid yellow;  
  }
  img {
    width: 35px;
    image-rendering: crisp-edges;
  }
`;

const Links = styled.div`
  display: flex;
`;

const Navbar = () => {
  const setup = fs.existsSync(Global.PROFILES_PATH);
  return (
    <Container>
      <Links>
        <Logo src={logo} />
        <PageLink tabIndex={setup ? 1 : -1} exact to="/" activeClassName="active">
          <img alt="Instances" src={instances} />
        </PageLink>
        <PageLink tabIndex={setup ? 1 : -1} to="/discover" activeClassName="active">
          <img alt="Discover" src={discover} />
        </PageLink>
        <PageLink tabIndex={setup ? 1 : -1} to="/settings" activeClassName="active">
          <img alt="Settings" src={settings} />
        </PageLink>
      </Links>
      <Downloads />
    </Container>
  );
};

export default Navbar;
