import React from 'react';
import SubAssetEditor from '../components/subAssetEditor';
export default function EditPageMods({ id }) {
  return (
    <>
      <SubAssetEditor id={id} assetType="mod" />
    </>
  );
}
