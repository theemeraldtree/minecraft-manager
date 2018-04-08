import React from 'react';
import Timings from '../../../style/timings';
import PropTypes from 'prop-types';
import ButtonIcon from '../buttonicons';
import ButtonColors from '../buttoncolors';
import styled from 'styled-components';
import Tooltip from '../../tooltip/tooltip';
const Wrapper = styled.div`
    width: 40px;
    height: 40px;
    cursor: pointer;
    position: relative;
    border-radius: 4px;
    display: inline-block;
    background-color: ${props => ButtonColors.getButtonColor(props.color)};
    transition: ${Timings.hoverTransition};
    &:hover,&.disabled {
        transition: ${Timings.hoverTransition};
        filter: brightness(40%);
    }
    ${props => props.disabled && `
        transition: ${Timings.hoverTransition};
        filter: brightness(40%);
    `}
`
const Icon = ButtonIcon.extend`
    width: 23px;
    height: 23px;
    margin: 10px;
    background-size: 23px 23px;
    display: inline-block;
    position: absolute;
    left: 0;
`
const IconButton = ({children, showTooltip, tooltip, tooltipAlign, onClick, type, disabled, className}) => (
    <Wrapper onClick={onClick} color={type} disabled={disabled} className={`${className ? className : ''}`}>
        {showTooltip && <Tooltip className='tooltip' align={tooltipAlign}>{tooltip}</Tooltip>}
        <Icon icon={type}/>
        <p className='text'>{children}</p>
    </Wrapper>
);

IconButton.propTypes = {
    type: PropTypes.oneOf(['launch', 'edit', 'delete', 'share', 'update', 'install']),
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    showTooltip: PropTypes.bool,
    tooltip: PropTypes.string,
    tooltipAlign: PropTypes.oneOf(['top', 'bottom', 'right', 'left'])
}

export default IconButton;