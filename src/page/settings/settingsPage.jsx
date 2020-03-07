import React, { useState, useEffect, useContext } from 'react';
import Page from '../page';
import styled from 'styled-components';
import About from './pages/about';
import General from './pages/general';
import Defaults from './pages/defaults';
import Help from './pages/help';
import NavContext from '../../navContext';
const Sidebar = styled.div`
  height: 100%;
  position: absolute;
  background-color: #2b2b2b;
  width: 120px;
`;

const Item = styled.p`
  margin-top: 10px;
  width: 100%;
  display: block;
  height: 25px;
  text-align: center;
  color: white;
  text-decoration: none;
  font-size: 15pt;
  font-weight: 100;
  cursor: pointer;
  &:hover {
    filter: brightness(0.75);
  }
  ${props =>
    props.active &&
    `
        font-weight: bolder;
        &:hover {
            filter: brightness(1.0);
        }
    `}
  margin-bottom: 15px;
  transition: font-weight 150ms;
`;

const Container = styled.div`
  margin-left: 130px;
  color: white;
  overflow-y: scroll;
  flex: 1 1 auto;
  height: 100%;
`;

const Wrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

export default function SettingsPage() {
  const { header } = useContext(NavContext);

  const [settingsPage, setSettingsPage] = useState('about');

  useEffect(() => {
    header.setTitle('settings');
    header.setShowBackButton(true);
    header.setShowChildren(false);
    header.setBackLink(undefined);
    header.setOnBackClick(undefined);
  }, []);

  return (
    <Page>
      <Wrapper>
        <Sidebar>
          <Item onClick={() => setSettingsPage('about')} active={settingsPage === 'about'}>
            about
          </Item>
          <Item onClick={() => setSettingsPage('general')} active={settingsPage === 'general'}>
            general
          </Item>
          <Item onClick={() => setSettingsPage('defaults')} active={settingsPage === 'defaults'}>
            defaults
          </Item>
          <Item onClick={() => setSettingsPage('help')} active={settingsPage === 'help'}>
            help
          </Item>
        </Sidebar>
        <Container>
          {settingsPage === 'about' && <About />}
          {settingsPage === 'general' && <General />}
          {settingsPage === 'defaults' && <Defaults />}
          {settingsPage === 'help' && <Help />}
        </Container>
      </Wrapper>
    </Page>
  );
}
