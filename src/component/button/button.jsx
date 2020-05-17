/* eslint-disable */
import React from 'react';
import styled, { css } from 'styled-components';
import FluentHover from '../../util/fluentHover';

function getColor(name) {
  switch (name) {
    case 'purple':
      return '#911895';
    case 'green':
      return '#138c0a';
    case 'yellow':
      return '#a18606';
    case 'blue':
      return '#185F95';
    case 'red':
      return '#8a1111';
    default:
      return name;
  }
}

const Base = styled.button.attrs(props => ({
  style: {
    background: getColor(props.color)
  }
}))`
  padding: 11.5px;
  color: white;
  width: fit-content;
  display: inline-block;
  cursor: pointer;
  outline: none;
  border: 0;
  font-size: 12pt;
  transition: 150ms;
  ${props =>
    props.disabled &&
    css`
      filter: brightness(0.65);
    `}
  img {
    width: 90%;
  }
  .spinner {
    width: 20px;
    height: 20px;

    div {
      width: 15px;
      height: 15px;
      border-width: 3px;
    }
  }
  &:hover {
    ${props =>
    !props.disabled &&
    css`
        transform: scale(1.05);
      `}
    ${props =>
    props.disabled &&
    css`
        cursor: not-allowed;
      `}
  }
  &:active {
    transform: scale(0.95);
  }
  &:focus-visible {
    outline: 2px solid yellow;
  }
`;

const Button = ({ children, color, className, onClick, disabled, dimHoverEffect = false }) => {
  const ref = React.createRef();
  const baseColor = getColor(color);

  return (
    <Base ref={ref} disabled={disabled} color={color} className={className} onMouseMove={e => FluentHover.mouseMove(e, ref, baseColor, dimHoverEffect)} onMouseLeave={() => FluentHover.mouseLeave(ref, baseColor)} onClick={onClick}>
      {children}
    </Base>
  )
}


export default Button;
