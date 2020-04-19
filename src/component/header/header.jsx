import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Link, withRouter } from 'react-router-dom';
import transition from 'styled-transition-group';
import NavContext from '../../navContext';

const BG = styled.div`
  min-height: 50px;
  background-color: #2b2b2b;
  display: flex;
  align-items: center;
  white-space: nowrap;
`;

const Title = styled.p`
  color: white;
  margin: 0;
  margin-left: 10px;
  font-size: 27pt;
  font-weight: 900;
  transition: 150ms;
  color: #e0e0e0;
`;

const BackButton = transition.button`
  background: none;
  border: 0;
  color: white;
  font-weight: 900;
  text-decoration: none;
  font-size: 17pt;
  margin-left: 8px;
  cursor: pointer;
  
  &:hover {
      filter: brightness(0.75);;
  }
  
  & a {
      text-decoration: none;
      color: white;
      pointer-events: all;
  }
  
  &:enter {
      margin-left: -35px
  }
  
  &:enter-active {
      margin-left: 8px;
      transition: 150ms;
  }
  
  &:exit {
      margin-left: 8px;
  }

  &:exit-active {
      margin-left: -35px;
      transition: 150ms;
  }

  &:focus-visible {
    outline: 2px solid yellow;
  }

  ${props =>
    props.isLink &&
    css`
      pointer-events: none;
    `}
`;

const Items = transition.div`
    display: flex;
    align-items: center;
    padding-right: 10px;
    opacity: 1;
    &:enter {
        position: relative;
        left: 50px;
        opacity: 0;
    }
    &:enter-active {
        position: relative;
        left: 0;
        opacity: 1;
        transition: 150ms;
    }
    &:exit {
        position: relative;
        opacity: 1;
    }
    &:exit-active {
        position: relative;
        left: 50px;
        opacity: 0;
        transition: 150ms;
    }
`;

const Header = ({ history }) => {
  const { header } = useContext(NavContext);

  const { title, children, backLink, showBackButton, showChildren, onBackClick } = header;

  const click = () => {
    if (!backLink) {
      const callback = onBackClick || history.goBack;
      callback();
    }
  };
  return (
    <BG>
      <BackButton
        isLink={backLink !== undefined}
        unmountOnExit
        in={showBackButton}
        tabIndex={`${backLink ? '-1' : '0'}`}
        timeout={150}
        onClick={click}
      >
        {!backLink && '←'}
        {backLink && <Link to={backLink}>←</Link>}
      </BackButton>
      <Title>{title}</Title>
      <Items unmountOnExit in={showChildren} timeout={150}>
        {children}
      </Items>
    </BG>
  );
};

Header.propTypes = {
  history: PropTypes.object.isRequired
};

export default withRouter(Header);
