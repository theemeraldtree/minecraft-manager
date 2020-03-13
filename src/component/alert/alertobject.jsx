import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Button from '../button/button';
import AlertBackground from './alertbackground';

const InputContainer = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  button {
    margin: 2px;
  }
  display: flex;
  align-items: center;
`;

export default function AlertObject({ children, buttons }) {
  return (
    <AlertBackground>
      <div dangerouslySetInnerHTML={{ __html: children }} />

      <InputContainer>
        {buttons.map(button => (
          <Button key={button.text} onClick={button.onClick} color={button.color}>
            {button.text}
          </Button>
        ))}
      </InputContainer>
    </AlertBackground>
  );
}

AlertObject.propTypes = {
  children: PropTypes.node.isRequired,
  buttons: PropTypes.array
};
