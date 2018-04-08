import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../tooltip/tooltip';
import Colors from '../../style/colors';
import styled from 'styled-components';
const Wrapper = styled.div`
    padding: 5px;
    border-radius: 6px;
    width: fit-content;
    background: ${props => Colors.getColor(props.color)};
`
const Text = styled.p`
    margin: 0;
    text-align: center;
    color: white;
    overflow: hidden;
    text-overflow: ellipsis;
`
const TooltipContainer = styled.div`
    width: 100%;
    position: absolute;
    height: 100%;
    top: 0;
`
const Badge = ({children, showTooltip, tooltip, tooltipAlign, title, color, className}) => (
    <Wrapper color={color} title={title ? title : ''} className={className ? className : ''}>
        {showTooltip && <TooltipContainer><Tooltip align={tooltipAlign}>{tooltip}</Tooltip></TooltipContainer>}
        <Text>{children}</Text>
    </Wrapper>
);

Badge.propTypes = {
    color: PropTypes.oneOf(['green', 'red', 'orange', 'purple']),
    disabled: PropTypes.bool,
    showTooltip: PropTypes.bool,
    tooltip: PropTypes.string,
    tooltipAlign: PropTypes.oneOf(['top', 'bottom', 'right', 'left'])
}

export default Badge;