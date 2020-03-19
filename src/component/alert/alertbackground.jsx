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
  max-width: 500px;
  max-height: 500px;
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

  textarea {
    background: black;
    border: 0;
    font-family: monospace;
    color: white;
    width: 100%;
    height: 40vh;
    resize: none;
    max-height: 300px;
    white-space: pre;
  }

  textarea.wrap {
    white-space: normal;
  }

  textarea:focus {
    outline: none;
  }

  animation: ${INTRO} 125ms ease-out;

  div.buttons {
    position: absolute;
    bottom: 10px;
    right: 10px;
  }
`;

export default AlertBackground;
