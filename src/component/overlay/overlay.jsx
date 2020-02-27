import React from 'react';
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

    ${props => props.force && `
        z-index: 20;
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
`

const Overlay = props => (
    <BG 
        force={props.force}
        timeout={125}
        in={props.in}
        unmountOnExit
    >
        {props.children}
    </BG>
);

Overlay.defaultProps = {
    in: true
}
export default Overlay;