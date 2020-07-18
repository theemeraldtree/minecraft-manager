import React from 'react';
import fs from 'fs';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { remote } from 'electron';
import Downloads from './downloads/downloads';
import Global from '../../util/global';
import logo from '../../img/logo-sm.png';
import instances from './img/instances.png';
import discover from './img/discover.png';
import settings from './img/settings.png';
import minimize from './img/minimize.png';
import maximize from './img/maximize.png';
import close from './img/close.png';

const currentWindow = remote.getCurrentWindow();

const Container = styled.div`
  width: 100%;
  height: 45px;
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

const WindowButton = styled.div`
  width: 40px;
  height: 30px;
  z-index: 20;
  top: 0;
  background-color: #0e0e0e;
  background-size: 13px;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  -webkit-app-region: no-drag;
  &:hover {
    background-color: #1d1d1d;
  }
`;

const MinimizeButton = styled(WindowButton)`
  background-image: url(${minimize});
`;

const MaximizeButton = styled(WindowButton)`
  background-image: url(${maximize});
`;

const CloseButton = styled(WindowButton)`
  background-image: url(${close});
  &:hover {
    filter: brightness(0.9);
    background-color: red;
  }
`;

const WindowControls = styled.div`
  position: absolute;
  right: 10px;
  display: flex;
`;

const Navbar = () => {
  const setup = fs.existsSync(Global.PROFILES_PATH);

  const minimizeClick = () => {
    currentWindow.minimize();
  };

  const maximizeClick = () => {
    if (!currentWindow.isMaximized()) {
      currentWindow.maximize();
    } else {
      currentWindow.unmaximize();
    }
  };

  const closeClick = () => {
    currentWindow.close();
  };

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
      <WindowControls>
        <MinimizeButton onClick={minimizeClick} />
        <MaximizeButton onClick={maximizeClick} />
        <CloseButton onClick={closeClick} />
      </WindowControls>
      <Downloads />
    </Container>
  );
};

export default Navbar;
