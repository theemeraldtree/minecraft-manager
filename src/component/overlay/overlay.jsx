import React from 'react';
import PropTypes from 'prop-types';
import transition from 'styled-transition-group';

const BG = transition.div`
    width: 100%;
    height: 100%;
    position: absolute;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    left: 0;
    z-index: 3;

    ${props =>
      props.force &&
      `
        z-index: 10;
    `}

    &:enter {
        opacity: 0;
    }
    &:enter-active {
        opacity: 1;
        transition: 125ms;
    }
    &:exit {
        opacity: 1;
    }
    &:exit-active {
        opacity: 0;
        transition: 125ms;
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
