import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { FluentHover } from '@theemeraldtree/emeraldui';
import About from './pages/about';
import General from './pages/general';
import Defaults from './pages/defaults';
import Help from './pages/help';
import NavContext from '../../navContext';
import Java from './pages/java';
import Accounts from './pages/accounts';

const Sidebar = styled.div`
  height: 100%;
  position: absolute;
  background-color: #2b2b2b;
  width: 120px;
`;

const ItemBase = styled.p`
  width: calc(100% - 5px);
  display: block;
  height: 25px;
  color: white;
  text-decoration: none;
  font-size: 12pt;
  font-weight: 400;
  cursor: pointer;
  ${props =>
    props.active &&
    css`
      filter: brightness(1);
      background: #424242 !important;
      &:hover {
        filter: brightness(1);
      }
  `}

  margin-bottom: 0;
  margin-top: 0;
  padding-top: 10px;
  padding-bottom: 4px;
  padding-left: 5px;
  transition: 150ms;
`;

const Container = styled.div`
  margin-left: 130px;
  color: white;
  overflow-y: auto;
  flex: 1 1 auto;
  height: 100%;
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const Wrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

const Item = ({ onClick, active, children }) => {
  const ref = React.createRef();
  return (
    <ItemBase
      ref={ref}
      onClick={onClick}
      active={active}
      onMouseMove={e => FluentHover.mouseMove(e, ref, '#363636')}
      onMouseLeave={() => FluentHover.mouseLeave(ref, '#2b2b2b')}
    >
      {children}
    </ItemBase>
  );
};

Item.propTypes = {
  onClick: PropTypes.func,
  active: PropTypes.bool,
  children: PropTypes.any
};

export default function SettingsPage() {
  const { header } = useContext(NavContext);

  const [settingsPage, setSettingsPage] = useState('about');

  useEffect(() => {
    header.setTitle('settings');
    header.setShowBackButton(false);
    header.setShowChildren(false);
    header.setBackLink(undefined);
    header.setOnBackClick(undefined);
  }, []);

  return (
    <>
      <Wrapper>
        <Sidebar>
          <Item onClick={() => setSettingsPage('about')} active={settingsPage === 'about'}>
            About
          </Item>
          <Item onClick={() => setSettingsPage('accounts')} active={settingsPage === 'accounts'}>
            Accounts
          </Item>
          <Item onClick={() => setSettingsPage('general')} active={settingsPage === 'general'}>
            General
          </Item>
          <Item onClick={() => setSettingsPage('java')} active={settingsPage === 'java'}>
            Java
          </Item>
          <Item onClick={() => setSettingsPage('defaults')} active={settingsPage === 'defaults'}>
            Defaults
          </Item>
          <Item onClick={() => setSettingsPage('help')} active={settingsPage === 'help'}>
            Help
          </Item>
        </Sidebar>
        <Container>
          {settingsPage === 'about' && <About />}
          {settingsPage === 'general' && <General />}
          {settingsPage === 'java' && <Java />}
          {settingsPage === 'accounts' && <Accounts />}
          {settingsPage === 'defaults' && <Defaults />}
          {settingsPage === 'help' && <Help />}
        </Container>
      </Wrapper>
    </>
  );
}
