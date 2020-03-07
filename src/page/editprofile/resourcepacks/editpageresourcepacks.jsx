import React from 'react';
import SubAssetEditor from '../components/subAssetEditor';
export default function EditPageResourcePacks({ id }) {
  return (
    <>
      <SubAssetEditor id={id} assetType="resourcepack" />
    </>
  );
}
