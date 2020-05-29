/* eslint-disable */
import React from 'react';
import styled, { css } from 'styled-components';

const BG = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 20px;
  background: #6E6E6E;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 0;
  cursor: pointer;
  transition: 150ms; 
  ${props => props.active && css`
    background: rgb(19, 140, 10);
  `}
  ${props => props.disabled && css`
    cursor: not-allowed;
    opacity: 0.5;
    &:hover {
      filter: brightness(1.0) !important;
    }
  `}
  &:hover {
    filter: brightness(1.5);
  }
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 8px;
`

export default function RadioButton({ active, onClick, className, disabled }) {
  return (
    <BG disabled={disabled} className={className} active={active} onClick={!disabled ? onClick : undefined}>
      {active && <Dot />}
    </BG>
  )
}