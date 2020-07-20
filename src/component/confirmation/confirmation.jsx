import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button } from '@theemeraldtree/emeraldui';
import Overlay from '../overlay/overlay';
import AlertBackground from '../alert/alertbackground';

const DelButtons = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  button {
    margin: 2px;
  }
`;

const Confirmation = ({
  cancelDelete,
  confirmDelete,
  cancelText,
  confirmText,
  questionText,
  children,
  hideConfirm
}) => (
  <Overlay>
    <AlertBackground>
      {questionText && <h1>{questionText}</h1>}
      {children && children}
      <DelButtons>
        <Button onClick={cancelDelete} color="transparent">
          {cancelText}
        </Button>
        {!hideConfirm && (
          <Button onClick={confirmDelete} color="green">
            {confirmText}
          </Button>
        )}
      </DelButtons>
    </AlertBackground>
  </Overlay>
);

Confirmation.propTypes = {
  cancelDelete: PropTypes.func,
  confirmDelete: PropTypes.func,

  cancelText: PropTypes.string,
  confirmText: PropTypes.string,
  questionText: PropTypes.string,

  children: PropTypes.node,
  hideConfirm: PropTypes.bool
};

Confirmation.defaultProps = {
  cancelText: 'Cancel',
  confirmText: 'Confirm'
};

export default Confirmation;
