import React from 'react';
import PropTypes from 'prop-types';
import Timings from '../../../style/timings';
import Tooltip from '../../tooltip/tooltip';
import ButtonColors from '../buttoncolors';
import ButtonIcon from '../buttonicons';
import styled from 'styled-components';
const Wrapper = styled.div`
    width: 231px;
    height: 73px;
    cursor: pointer;
    position: relative;
    border-radius: 4px;
    >*:not(.tooltip) {
        transition: ${Timings.hoverTransition};
    }

    &:hover {
        transition: ${Timings.hoverTransition};
        >*:not(.tooltip) {
            transition: ${Timings.hoverTransition};
            filter: brightness(40%);
        }
    }

    ${props => props.disabled && `
        transition: ${Timings.hoverTransition};
        >*:not(.tooltip) {
            transition: ${Timings.hoverTransition};
            filter: brightness(40%);
        }
    `}

    background-color: ${props => ButtonColors.getButtonColor(props.color)};


`

const Icon = ButtonIcon.extend`
    width: 50px;
    height: 50px;
    margin: 11px;
    background-size: 50px 50px;
    display: inline-block;
    position: absolute;
    left: 0;
`
const Label = styled.p`
    display: inline-block;
    font-size: 25pt;
    font-weight: bolder;
    top: 14px;
    position: absolute;
    margin: 0;
    left: 70px;
    color: white;

    ${props => props.color.substring(0, 5) === 'color' && `
        left: 11px;
    `}
`
const WideButton = ({children, showTooltip, tooltip, tooltipAlign, onClick, type, disabled, className}) => (
    <Wrapper onClick={onClick} color={type} disabled={disabled} className={className ? className : ''}>
        {showTooltip && <Tooltip className='tooltip' align={tooltipAlign}>{tooltip}</Tooltip>}
        <Icon icon={type} />
        <Label color={type}>{children}</Label>
    </Wrapper>
);

WideButton.propTypes = {
    type: PropTypes.oneOf(['launch', 'edit', 'delete', 'share', 'update']),
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    showTooltip: PropTypes.bool,
    tooltip: PropTypes.string,
    tooltipAlign: PropTypes.oneOf(['top', 'bottom', 'right', 'left'])
}

export default WideButton;