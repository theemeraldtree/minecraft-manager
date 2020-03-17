import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ProfilesManager from '../../manager/profilesManager';
import Global from '../../util/global';

const Container = styled.div`
  max-height: 45vh;
  overflow-y: auto;

  &::-webkit-scrollbar-track {
    background: none;
  }
`;

const ProfBG = styled.button`
  border: 0;
  display: flex;
  align-items: center;
  height: 50px;
  background: #121212;
  padding: 5px;
  margin-bottom: 5px;
  color: white;
  width: 100%;
  cursor: pointer;

  p {
    font-weight: 900;
    margin: 0;
    margin-left: 10px;
    font-size: 12pt;
  }

  &:hover {
    filter: brightness(0.75);
  }

  &:focus-visible {
    outline: 2px solid yellow;
  }
`;

const ProfImg = styled.img`
  width: 40px;
  height: 40px;
`;

export default function ProfileSelector({ onSelect, hideProfile }) {
  return (
    <Container>
      {ProfilesManager.loadedProfiles
        .filter(prof => prof.id !== hideProfile)
        .map(profile => (
          <ProfBG key={`profile-selector-${profile.id}`} onClick={e => onSelect(profile, e)}>
            <ProfImg src={`file:///${profile.iconPath}#${Global.cacheUpdateTime}`} />
            <p>{profile.name}</p>
          </ProfBG>
        ))}
    </Container>
  );
}

ProfileSelector.propTypes = {
  onSelect: PropTypes.func,
  hideProfile: PropTypes.string
};
