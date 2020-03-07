import React from 'react';
import PropTypes from 'prop-types';
import SubAssetEditor from '../components/subAssetEditor';

export default function EditPageResourcePacks({ id }) {
  return (
    <>
      <SubAssetEditor id={id} assetType="resourcepack" />
    </>
  );
}

EditPageResourcePacks.propTypes = {
  id: PropTypes.string.isRequired
};
