import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes, css } from 'styled-components';
import ToastManager from '../../manager/toastManager';

const slideIn = keyframes`
    0% {
        margin-bottom: -50px;
    }

    100% {
        margin-bottom: 7px;
    }
`;

const slideOutAnim = keyframes`
    0% {
        opacity: 1;
        margin-bottom: 7px;
    }

    100% {
        opacity: 0;
        margin-bottom: -50px;
    }
`;

const BG = styled.div`
  width: fit-content;
  min-width: 50px;
  height: 20px;
  background-color: #505050;
  z-index: 9999;
  border-radius: 50px;
  box-shadow: 0px 0px 17px 0px rgba(0, 0, 0, 0.75);
  color: white;
  padding: 10px;
  position: relative;
  pointer-events: auto;
  transition: 1s;
  margin: 0 auto;
  margin-bottom: 7px;
  animation: ${slideIn} 0.3s ease;
  ${props =>
    props.slideOut &&
    css`
      animation: ${slideOutAnim} 0.3s ease;
    `}
`;

const Text = styled.p`
  margin: 0;
`;

export default function NoticeToastObject({ id, text }) {
  const [slideOut, setSlideOut] = useState(false);


  useEffect(() => {
    setTimeout(() => {
      setSlideOut(true);
      setTimeout(() => {
        ToastManager.dismissToast(id);
      }, 300);
    }, 1000);
  }, []);


  return (
    <BG slideOut={slideOut}>
      <Text>{text}</Text>
    </BG>
  );
}

NoticeToastObject.propTypes = {
  id: PropTypes.string,
  text: PropTypes.string.isRequired
};
