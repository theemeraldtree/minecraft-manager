import React from 'react';
import styled, { keyframes } from 'styled-components';

const Wrapper = styled.div`
  width: 100%;
  min-height: 5px;
  height: 100%;
`;

const Animation = keyframes`
    0% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
`;

const Filler = styled.div.attrs(props => ({
  style: {
    width: `${props.progress}%`
  }
}))`
  height: 100%;
  background: linear-gradient(270deg, #0a993c, #0a993c, #0add53, #0a993c, #0a993c);
  background-size: 600% 600%;
  animation: ${Animation} 1.5s ease infinite;
`;

const ProgressBar = props => (
  <Wrapper>
    <Filler {...props} />
  </Wrapper>
);

export default ProgressBar;
