import React from 'react';
import styled from 'styled-components';
const sanitizeHTML = require('sanitize-html');

const Styling = styled.div`
  color: white;
  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  span {
    color: white;
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
  }

  word-break: break-word;
  padding: 10px;

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
          iframe: ['src'],
          img: ['src', 'width', 'height']
        },
        allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']
      })
    }}
  />
);

export default SanitizedHTML;
