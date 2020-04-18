import React from 'react';
import styled, { keyframes } from 'styled-components';

const Animation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Container = styled.div`
  width: 80px;
  height: 80px;
  position: relative;

  div {
    position: absolute;
    top: 0;
    width: 60px;
    height: 60px;
    border: 10px solid transparent;
    border-top: 10px solid white;
    border-radius: 50%;
    animation: 800ms infinite ${Animation};
  }

  div:nth-child(2) {
    animation-delay: 50ms;
  }

  div:nth-child(3) {
    animation-delay: 100ms;
  }

  div:nth-child(4) {
    animation-delay: 150ms;
  }

  div:nth-child(5) {
    animation-delay: 200ms;
  }
`;

const Spinner = () => (
  <Container className="spinner">
    <div />
    <div />
    <div />
    <div />
    <div />
  </Container>
);

export default Spinner;
