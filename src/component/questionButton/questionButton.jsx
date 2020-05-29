import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const BG = styled.button`
  width: 17px;
  height: 17px;
  border: 2px solid white;
  border-radius: 17px;
  cursor: pointer;
  color: white;
  text-align: center;
  background: none;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 8pt;
  font-weight: 900;
  margin-left: 7px;
  p {
    margin: 0;
  }
`;


const QuestionButton = ({ onClick }) => (
  <BG onClick={onClick}>
    <p>?</p>
  </BG>
);

QuestionButton.propTypes = {
  onClick: PropTypes.func
};

export default QuestionButton;
