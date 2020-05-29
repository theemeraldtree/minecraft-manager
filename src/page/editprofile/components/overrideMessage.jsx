import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const BG = styled.div`
  width: calc(100% - 24px);
  height: 40px;
  background: #2e2e2e;
  padding: 5px;
  margin-top: 5px;

  h2 {
    margin: 0;
    font-size: 13pt;
  }

  h3 {
    margin: 0;
    font-size: 13pt;
    font-weight: 500;
  }
`;

const OverrideMessage = () => (
  <BG>
    <h2>These settings override Global Settings</h2>
    <h3><Link to="/settings">Configure Global Settings</Link></h3>
  </BG>
);

export default OverrideMessage;
