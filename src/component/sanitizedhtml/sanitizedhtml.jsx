import React from 'react';
import styled from 'styled-components';
const sanitizeHTML = require('sanitize-html');

const Styling = styled.div`
  color: white;
  p, h1, h2, h3, h4, h5, h6, span {
    color: white;
  }

  iframe {
    border: 0;  
  }

  word-break: break-word;
  padding: 10px;
`
const SanitizedHTML = ({html}) => (
    <Styling dangerouslySetInnerHTML={{__html: sanitizeHTML(html, {
        allowedTags: [ 'b', 'i', 'em', 'strong', 'a', 'iframe', 'h1', 'p', 'img', 'span', 'h2', 'h3', 'h4', 'h5', 'h6'],
        allowedAttributes: {
          '*': [ 'style' ],
          'a': [ 'href' ],
          'iframe': [ 'src' ],
          'img': [ 'src' ]
        },
      allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']
  })}} />
)

export default SanitizedHTML;