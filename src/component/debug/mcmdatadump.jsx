import React from 'react';
import styled from 'styled-components';
import Debug from '../../util/debug';

const TA = styled.textarea`
  width: 100%;
  background: black;
  color: white;
  font-family: monospace;
  height: 100vh;
  border: 0;
  resize: none;
  white-space: pre;
  &:focus {
    outline: none;
  }
`;

const MCMDataDump = () => <TA readOnly value={Debug.dataDump()} />;

export default MCMDataDump;
