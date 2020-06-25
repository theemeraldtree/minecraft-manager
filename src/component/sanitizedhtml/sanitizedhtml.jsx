import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Styling = styled.div`
  height: 100%;
  width: calc(100% - 20px);
  color: #ececec;

  * {
    color: #ececec;
    font-family: sans-serif;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar {
    width: 10px;
    padding-top: 5px;
  }

  ::-webkit-scrollbar-track {
    border: 2px solid rgba(0, 0, 0, 0);
    background-clip: padding-box;
    border-radius: 30px;
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    border: 2px solid rgba(0, 0, 0, 0);
    background-clip: padding-box;
    border-radius: 30px;
    background-color: #5c5c5c;
  } 

  ::-webkit-scrollbar-thumb:hover {
    background-color: #323232;
  }

  ::-webkit-scrollbar-corner {
    opacity: 0;
  } 

  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6, 
  span {
    color: #ececec;
    overflow-y: hidden;
  }

  img {
    max-width: 100%;
    display: inline;
    vertical-align: top;
    height: auto;
  }

  a {
    text-decoration: none;
    color: #42b3f5;
  }

  iframe {
    border: 0;
    width: 400px;
    height: 200px;
  }

  word-break: break-word;
  padding: 10px;

  span[style*='color:#800000'] {
    color: #cc0000 !important;
  }

  span[style*='color:#000'] {
    color: white !important;
  }

  ${props =>
    props.small &&
    `
    h1 {
      font-size: 16pt;
    }

    p {
      font-size: 11pt;
    }
  `}

  hr {
    border: 0;
  }
`;

// TODO: Spoiler control buttons
export default function SanitizedHTML({ html, small }) {
  return <Styling dangerouslySetInnerHTML={{ __html: html }} small={small} />;
}

SanitizedHTML.propTypes = {
  html: PropTypes.string,
  small: PropTypes.bool
};
