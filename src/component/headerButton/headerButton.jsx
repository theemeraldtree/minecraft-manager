/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import Button from '../button/button';

const HeaderButtonBase = styled(Button)`
  background-color: #404040;
  border: 0;
  &:hover {
    transform: scale(1);
    filter: brightness(1);
    background-color: #5b5b5b;
    border-bottom: 2px solid #08b20b;
  }
  ${props =>
    props.active &&
    css`
        border-bottom: 4px solid #08b20b;
        &:hover {
            border-bottom: 4px solid #08b20b !important;
        }
    `}
  ${props =>
    !props.active &&
    css`
        border-bottom: 0px solid #08b20b;
    `}
  transition: 150ms;
  margin-right: 3px;
  &:focus-visible {
    border-color: #08b20b;
    outline: 2px solid yellow;
  }
`;

const HeaderButton = ({ active, children, onClick, data }) => (
  <HeaderButtonBase active={active} onClick={onClick} color="#404040" data={data}>
    {children}
  </HeaderButtonBase>
);

HeaderButton.propTypes = {
  children: PropTypes.any,
  onClick: PropTypes.func,
  active: PropTypes.bool
};

export default HeaderButton;
