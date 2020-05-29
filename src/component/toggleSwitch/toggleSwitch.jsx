/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

const BG = styled.div`
  width: 48px;
  height: 26px;
  background: #6E6E6E;
  border-radius: 17px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: 150ms;
  margin-right: 11px !important;
  ${props => props.active && css`
    background: #16AD77;
  `}
`

const Slider = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 35px;
  background: #CFCFCF;
  margin-left: 3px;
  transition: 150ms;
  ${props => props.active && css`
    margin-left: 25px;
  `}
`

const ToggleSwitch = ({ onClick, value }) => (
  <BG active={value} onClick={onClick} className='checkbox'>
    <Slider active={value} />
  </BG>
);

ToggleSwitch.propTypes = {
  value: PropTypes.bool,
  onClick: PropTypes.func
}




export default ToggleSwitch;
