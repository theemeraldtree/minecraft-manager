import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../../tooltip/tooltip';
import styled from 'styled-components';
const Wrapper = styled.div`
    width: 100%;
    height: 43px;
    cursor: pointer;
    position: relative;
    border-radius: 4px;
    background-color: #252525;
    margin-top: 6px;
    margin-bottom: 6px;
    padding-left: 6px;
    white-space: nowrap;
    ${props => props.selected && `
        background-color: green;
    `}
    >*:not(.tooltip) {
        transition: $HOVER_TRANSITION;
    }
    &:hover,&.disabled {
        transition: $HOVER_TRANSITION;
        >*:not(.tooltip) {
            transition: $HOVER_TRANSITION;
            filter: brightness(40%);
        }
    }
`
const Text = styled.p`
    color: white;
    display: inline-block;
    font-size: 14pt;
    font-weight: bolder;
    margin: 0;
    margin-top: 9px;
    text-overflow: ellipsis;
    width:100%;
    overflow: hidden;
`
const ListButton = ({children, selected, data, showTooltip, tooltip, tooltipAlign, onClick, disabled, className}) => (
    <Wrapper disabled={disabled} className={className ? className : ''} selected={selected} onClick={onClick} data-data={JSON.stringify(data)}>
        {showTooltip && <Tooltip align={tooltipAlign}>{tooltip}</Tooltip>}
        <Text>{children}</Text>
    </Wrapper>
);

ListButton.propTypes = {
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    showTooltip: PropTypes.bool,
    tooltip: PropTypes.string,
    tooltipAlign: PropTypes.oneOf(['top', 'bottom', 'right', 'left']),
    data: PropTypes.object
}

export default ListButton;