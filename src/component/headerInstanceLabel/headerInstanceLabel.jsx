import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import transition from 'styled-transition-group';
import ProfilesManager from '../../manager/profilesManager';

const Container = styled.div`
  position: absolute;
  left: calc(-100vw + ${props => props.left}px);
`;

const Clickable = styled.div`
  cursor: pointer;
  display: flex;
  width: min-content;
  
  h1 {
    margin: 0;
    font-size: 18pt;
  }

  img {
    width: 30px;
    height: 30px;
    margin-right: 5px;
  }
`;

const InstanceList = transition.div`
  position: absolute;
  top: 40px;
  min-width: 300px;
  width: 100%;
  background: #171717;
  height: 200px;
  max-height: 200px;
  z-index: 10000;
  transition: height 350ms;
  overflow-y: scroll;
  overflow-x: hidden;

  &:enter {
    height: 0;
  }

  &:enter-active {
    height: 100vh;
    transition: height 350ms;
  }
  
  &:exit {
    height: 100vh;
  }

  &:exit-active {
    height: 0;
    transition: height 350ms;
  }
`;

const InstanceContainer = styled.div`
  width: 100%;
  height: 32px;
  background: transparent;
  display: flex;
  padding-left: 5px;
  align-items: center;

  h1 {
    font-size: 11pt;
  }

  &:hover {
    background: black;
  }
`;

const Instance = ({ instance, onClick }) => (
  <InstanceContainer onClick={onClick}>
    <img src={instance.iconPath} alt={instance.name} />
    <h1>{instance.name}</h1>
  </InstanceContainer>
);

Instance.propTypes = {
  instance: PropTypes.object,
  onClick: PropTypes.func
};

export default function HeaderInstanceLabel({ left, instance, onSwitch }) {
  const [showProfileList, setShowProfileList] = useState(false);

  const toggleProfileList = () => {
    setShowProfileList(!showProfileList);
  };

  const switchInstance = newInstance => {
    onSwitch(newInstance);
  };

  return (
    <Container left={left}>
      <Clickable onClick={toggleProfileList}>
        <img src={instance.iconPath} alt={instance.name} />
        <h1>{instance.name}</h1>

        <InstanceList unmountOnExit timeout={350} in={showProfileList}>
          {ProfilesManager.loadedProfiles.map(inst => (
            <Instance key={inst.id} instance={inst} onClick={() => switchInstance(inst)} />
          ))}
        </InstanceList>
      </Clickable>
    </Container>
  );
}

HeaderInstanceLabel.propTypes = {
  left: PropTypes.number,
  instance: PropTypes.object,
  onSwitch: PropTypes.func
};
