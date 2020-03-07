import React from 'react';
import PropTypes from 'prop-types';
import SubAssetEditor from '../components/subAssetEditor';

export default function EditPageMods({ id }) {
  return (
    <>
      <SubAssetEditor id={id} assetType="mod" />
    </>
  );
}

EditPageMods.propTypes = {
  id: PropTypes.string.isRequired
};
