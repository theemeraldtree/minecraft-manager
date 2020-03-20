import React from 'react';
import PropTypes from 'prop-types';
import fs from 'fs';
import path from 'path';
import Overlay from '../../../component/overlay/overlay';
import AlertBackground from '../../../component/alert/alertbackground';
import Button from '../../../component/button/button';
import ProfileSelector from '../../../component/profileSelector/profileSelector';
import FSU from '../../../util/fsu';
import ToastManager from '../../../manager/toastManager';
import modVersionCheck from './modVersionCheck';

export default function MoveToOverlay({ show, profile, asset, assetType, cancelClick }) {
  const onSelect = newProfile => {
    if ((assetType === 'mod' && modVersionCheck(profile, newProfile, asset)) || assetType !== 'mod') {
      const newPath = path.join(newProfile.gameDir, asset.getMainFile().path);
      if (!fs.existsSync(newPath)) {
        FSU.renameMakeDirSync(
          path.join(profile.gameDir, asset.getMainFile().path),
          path.join(newProfile.gameDir, asset.getMainFile().path)
        );

        newProfile.addSubAsset(assetType, asset);
        profile.deleteSubAsset(assetType, asset);

        if (fs.existsSync(path.join(profile.profilePath, asset.icon))) {
          fs.renameSync(path.join(profile.profilePath, asset.icon), path.join(newProfile.profilePath, asset.icon));
        }

        cancelClick();

        ToastManager.noticeToast('Moved!');
      } else {
        ToastManager.createToast('Already exists', `${newProfile.name} already has ${asset.name}`);
      }
    }
  };

  return (
    <Overlay in={show}>
      <AlertBackground>
        <h1>move to...</h1>
        <p>where do you want to move this asset?</p>

        <ProfileSelector hideProfile={profile.id} onSelect={onSelect} />

        <div className="buttons">
          <Button color="red" onClick={cancelClick}>
            cancel
          </Button>
        </div>
      </AlertBackground>
    </Overlay>
  );
}

MoveToOverlay.propTypes = {
  show: PropTypes.bool,
  cancelClick: PropTypes.func,
  asset: PropTypes.object,
  profile: PropTypes.object,
  assetType: PropTypes.string
};
