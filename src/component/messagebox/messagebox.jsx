import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../tooltip/tooltip';
import styled from 'styled-components';
import Colors from '../../style/colors';
const Wrapper = styled.div`
    border-radius: 13px;
    width: fit-content;
    padding: 10px;
    background-color: ${props => Colors.getColor(props.color)};
    border: 5px solid white;
`
const Text = styled.p`
    color: white;
    font-size: 15pt;
    margin: 0;
`
const MessageBox = ({children, showTooltip, tooltip, tooltipAlign, color, className}) => (
    <Wrapper color={color} className={`${className ? className : ''}`}>
        {showTooltip && <Tooltip align={tooltipAlign}>{tooltip}</Tooltip>}
        <div className='icon' />
        <Text>{children}</Text>
    </Wrapper>
);

MessageBox.propTypes = {
    color: PropTypes.oneOf(['green', 'red', 'orange', 'purple']),
    disabled: PropTypes.bool,
    showTooltip: PropTypes.bool,
    tooltip: PropTypes.string,
    tooltipAlign: PropTypes.oneOf(['top', 'bottom', 'right', 'left'])
}

MessageBox.defaultProps = {
    color: 'red'
}
export default MessageBox;