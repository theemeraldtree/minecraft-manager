import styled, { keyframes } from 'styled-components';
const INTRO = keyframes`
    from {
        opacity: 0;
        transform: scale(1.2)
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
`;

const AlertBackground = styled.div`
  width: 100%;
  height: fit-content;
  max-width: 350px;
  max-height: 200px;
  margin: 10px;
  background-color: #222;
  color: white;
  position: relative;
  padding: 10px;
  padding-bottom: 70px;
  h1 {
    margin: 0;
    font-weight: 200;
    font-size: 21pt;
  }

  animation: ${INTRO} 125ms ease-out;
`;

export default AlertBackground;
