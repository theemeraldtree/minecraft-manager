import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import HeaderButton from '../../../component/headerButton/headerButton';
import ProfileSettingsJava from './pages/java';
import ProfilesManager from '../../../manager/profilesManager';
import Sync from './pages/sync';

const Header = styled.div`
  margin-top: 10px;
  height: 46px;
  flex-shrink: 0;
`;

const Container = styled.div`
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-flow: column;
`;

const Content = styled.div`
  height: 100%;
  overflow-y: auto;
  padding-bottom: 20px;
  &::-webkit-scrollbar-track {
    background: none;
  }
`;

export default function EditPageAdvanced({ id }) {
  const profile = ProfilesManager.getProfileFromID(id);

  const [currentPage, setCurrentPage] = useState('java');
  return (
    <Container>
      <Header>
        <HeaderButton active={currentPage === 'java'} onClick={() => setCurrentPage('java')}>
          Java
        </HeaderButton>
        <HeaderButton active={currentPage === 'sync'} onClick={() => setCurrentPage('sync')}>
          Sync
        </HeaderButton>
        <HeaderButton active={currentPage === 'other'} onClick={() => setCurrentPage('other')}>
          Other
        </HeaderButton>
      </Header>
      <Content>
        {currentPage === 'java' && <ProfileSettingsJava profile={profile} />}
        {currentPage === 'sync' && <Sync profile={profile} />}
      </Content>
    </Container>
  );
}

EditPageAdvanced.propTypes = {
  id: PropTypes.string
};
