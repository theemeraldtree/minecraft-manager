import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Overlay from '../overlay/overlay';
import AlertBackground from '../alert/alertbackground';
import Spinner from '../spinner/spinner';

const BG = styled(AlertBackground)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
`;

const LaunchingOverlay = ({ show }) => (
  <Overlay in={show}>
    <BG>
      <Spinner />
    </BG>
  </Overlay>
);

LaunchingOverlay.propTypes = {
  show: PropTypes.bool
};

export default LaunchingOverlay;
