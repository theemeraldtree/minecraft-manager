import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const TooltipBox = styled.div`
    background-color: black;
    color: #fff;
    visibility: hidden;
    border-radius: 6px;
    padding: 10px 10px;
    z-index: 1;
    position: absolute;
    width: max-content;
    opacity: 0;
    transition-property: opacity;
    transition: 0.5s;
    ${props => props.align === 'right' && `
        top: 50%;
        left: 115%;
        right: 0;
        transform: translateY(-50%);
        &::after {
            top: 50%;
            right: 100%;
            margin-top: -8px;
            border-color: transparent black transparent transparent;
        }
    `}
    ${props => props.align === 'bottom' && `
        top: 115%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 5px;
        &::after {
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-color: transparent transparent black transparent;
        }
    `}
    &::after {
        content: " ";
        position: absolute;
        border-width: 8px;
        border-style: solid;
    }
`

const Wrapper = styled.div`
    width: 100%;
    height: 100%;
    display: inline-block;
    position: relative;
    z-index: 100;
    &:hover ${TooltipBox} {
        visibility: visible;
        opacity: 1;
        transition: 0.5s;
    }
`

const Tooltip = ({align, className, children}) => (
    <Wrapper className={className ? className : ''}>
        <TooltipBox align={align}>
            {children}
        </TooltipBox>
    </Wrapper>
);

Tooltip.propTypes = {
    align: PropTypes.oneOf(['up', 'right', 'bottom', 'left'])
};

Tooltip.defaultProps = {
    align: 'right'
}

export default Tooltip;