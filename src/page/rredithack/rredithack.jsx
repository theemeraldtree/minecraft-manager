import React from 'react';
import PropTypes from 'prop-types';
import EditPage from '../editprofile/edit';

export default function RREditHack({ match }) {
  return (
    <EditPage
      match={{
        params: {
          id: match.params.id,
          page: 'general'
        }
      }}
      history={{}}
    />
  );
}

RREditHack.propTypes = {
  match: PropTypes.object
};
