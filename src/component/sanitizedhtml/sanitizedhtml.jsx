import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const sanitizeHTML = require('sanitize-html');

const Styling = styled.div`
  color: #ececec;
  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  span {
    color: #ececec;
  }

  img {
    max-width: 100%;
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
`;

const SanitizedHTML = ({ html, small }) => (
  <Styling
    small={small}
    dangerouslySetInnerHTML={{
      __html: sanitizeHTML(html, {
        allowedTags: [
          'br',
          'b',
          'i',
          'em',
          'strong',
          'a',
          'iframe',
          'h1',
          'p',
          'img',
          'span',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'ul',
          'li'
        ],
        allowedAttributes: {
          '*': ['style'],
          a: ['href'],
          iframe: ['src', 'allowfullscreen'],
          img: ['src', 'width', 'height']
        },
        allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']
      })
    }}
  />
);

SanitizedHTML.propTypes = {
  html: PropTypes.string,
  small: PropTypes.bool
};

export default SanitizedHTML;
