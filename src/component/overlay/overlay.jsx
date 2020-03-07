import React from 'react';
import PropTypes from 'prop-types';
import transition from 'styled-transition-group';

const BG = transition.div`
    width: 100%;
    height: 100%;
    position: absolute;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    left: 0;
    z-index: 3;

    ${props =>
      props.force &&
      `
        z-index: 20;
    `}

    &:enter {
        opacity: 0;
        backdrop-filter: blur(0);
    }
    &:enter-active {
        opacity: 1;
        backdrop-filter: blur(10px);
        transition: 125ms;
    }
    &:exit {
        opacity: 1;
        backdrop-filter: blur(10px);
    }
    &:exit-active {
        opacity: 0;
        transition: 125ms;
        backdrop-filter: blur(0);
    }
`;

const Overlay = props => (
  <BG force={props.force} timeout={125} in={props.in} unmountOnExit>
    {props.children}
  </BG>
);

Overlay.propTypes = {
  force: PropTypes.bool,
  in: PropTypes.bool,
  children: PropTypes.node.isRequired
};

Overlay.defaultProps = {
  in: true
};

export default Overlay;
