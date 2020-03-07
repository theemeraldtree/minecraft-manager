import React from 'react';
import PropTypes from 'prop-types';

const EditContainer = ({ children }) => <>{children}</>;

EditContainer.propTypes = {
  children: PropTypes.node.isRequired
};

export default EditContainer;
