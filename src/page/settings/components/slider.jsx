import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Detail } from '@theemeraldtree/emeraldui';

const Container = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  padding-top: 25px;
`;

const TB = styled.input.attrs({
  type: 'number'
})`
  background: #454547;
  width: 40px;
  height: 35px;
  border: 0;
  margin-right: 20px;
  color: white;
  padding-left: 5px;
  padding-right: 5px;
  font-size: 15pt;
  ${props => props.disabled && css`
    cursor: default;
  `}
  &:focus {
    outline: none;
  }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const Input = styled.input.attrs(props => ({
  type: 'range',
  min: props.min,
  max: props.max,
  step: props.step
}))`
  height: 3px;
  width: calc(100% - 120px);
  -webkit-appearance: none;
  &:focus {
    outline: none;
  }
  &::-webkit-slider-thumb {
    height: 15px;
    width: 15px;
    border-radius: 15px;
    background: #16AD77;
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -6px;
    ${props => props.disabled && css`
      cursor: default;
    `}
  }
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 3px;
    cursor: pointer;
    background: #454547;
    ${props => props.disabled && css`
      cursor: default;
    `}
  }
`;

const Label = styled.p`
  position: absolute;
  color: #cecece;
  font-size: 10pt;
  margin: 0;
  top: 35px;
`;

const LabelBeginning = styled(Label)`
  left: 60px;
`;

const LabelEnd = styled(Label)`
  right: 25px;
`;

const Title = styled(Detail)`
  position: absolute;
  left: 59px;
  top: 0;
`;

export default function Slider({ onChange, disabled, label, value, min, max, step }) {
  const changeHandler = e => {
    onChange(e.target.value);
  };

  const changeInputHandler = e => {
    if (e.target.value) {
      onChange(Math.abs(e.target.value));
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <Container>
      <Title>{label}</Title>
      <TB onChange={changeInputHandler} disabled={disabled} value={value} min={min} max={max} />
      <Input disabled={disabled} value={value} onChange={changeHandler} min={min} max={max} step={step} />
      <LabelBeginning>{min}</LabelBeginning>
      <LabelEnd>{max}</LabelEnd>
    </Container>
  );
}

Slider.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  onChange: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  label: PropTypes.string,
  disabled: PropTypes.bool
};
