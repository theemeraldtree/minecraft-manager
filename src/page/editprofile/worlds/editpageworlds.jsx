import React from 'react';
import PropTypes from 'prop-types';
import SubAssetEditor from '../components/subAssetEditor';

export default function EditPageWorlds({ id }) {
  return (
    <>
      <SubAssetEditor id={id} assetType="world" />
    </>
  );
}

EditPageWorlds.propTypes = {
  id: PropTypes.string.isRequired
};
