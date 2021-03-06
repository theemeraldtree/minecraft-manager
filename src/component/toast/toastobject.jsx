import React from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes, css } from 'styled-components';

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
        margin-bottom: -120px;
    }
`;

const BG = styled.div`
  width: 350px;
  height: fit-content;
  min-height: 50px;
  background-color: #2b2b2b;
  z-index: 9999;
  box-shadow: 0px 0px 17px 0px rgba(0, 0, 0, 0.75);
  color: white;
  padding: 10px;
  position: relative;
  pointer-events: auto;
  transition: 1s;
  margin-bottom: 7px;
  ${props =>
    !props.disableAnimation &&
    css`
      animation: ${slideIn} 0.3s ease;
    `}
  ${props =>
    props.slideOut &&
    css`
      animation: ${slideOutAnim} 0.3s ease;
    `}
`;

const Title = styled.p`
  font-weight: bolder;
  margin: 0;
`;

const Body = styled.p`
  margin: 0;
  word-break: break-word;
  a {
    color: #42b3f5;
    text-decoration: none;
  }
`;

const Dismiss = styled.p`
  position: absolute;
  top: 5px;
  right: 5px;
  margin: 0;
  cursor: pointer;
  color: #a1a1a1;
`;

export default function ToastObject({ id, title, body, error, dismiss, slideOut, disableAnimation }) {
  return (
    <BG disableAnimation={disableAnimation} slideOut={slideOut}>
      <Title>{title}</Title>
      <Dismiss
        onClick={() => {
          dismiss(id);
        }}
      >
        close
      </Dismiss>
      {!error && <Body dangerouslySetInnerHTML={{ __html: body }} />}
      {error && (
        <Body>
          {body}
          <br />
          <a href={`https://github.com/theemeraldtree/minecraft-manager/wiki/Error-Codes#${error}`}>
            Error Code: {error}
          </a>
        </Body>
      )}
    </BG>
  );
}

ToastObject.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  error: PropTypes.string,
  dismiss: PropTypes.func.isRequired,
  slideOut: PropTypes.bool,
  disableAnimation: PropTypes.bool
};
