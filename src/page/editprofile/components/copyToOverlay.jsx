import React from 'react';
import PropTypes from 'prop-types';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import Overlay from '../../../component/overlay/overlay';
import AlertBackground from '../../../component/alert/alertbackground';
import Button from '../../../component/button/button';
import ProfileSelector from '../../../component/profileSelector/profileSelector';
import Global from '../../../util/global';
import FSU from '../../../util/fsu';
import modVersionCheck from './modVersionCheck';
import ToastManager from '../../../manager/toastManager';

export default function CopyToOverlay({ show, profile, asset, assetType, cancelClick }) {
  const onSelect = (newProfile, e) => {
    if ((assetType === 'mod' && modVersionCheck(profile, newProfile, asset)) || assetType !== 'mod') {
      if (!fs.lstatSync(path.join(profile.gameDir, asset.getMainFile().path)).isDirectory()) {
        FSU.copyFileMakeDirSync(
          path.join(profile.gameDir, asset.getMainFile().path),
          path.join(newProfile.gameDir, asset.getMainFile().path)
        );
      } else {
        mkdirp.sync(path.join(newProfile.gameDir, asset.getMainFile().path));
        Global.copyDirSync(
          path.join(profile.gameDir, asset.getMainFile().path),
          path.join(newProfile.gameDir, asset.getMainFile().path)
        );
      }
      newProfile.addSubAsset(assetType, asset);
      if (fs.existsSync(path.join(profile.profilePath, asset.icon))) {
        fs.copyFileSync(path.join(profile.profilePath, asset.icon), path.join(newProfile.profilePath, asset.icon));
      }

      if (!e.shiftKey) {
        cancelClick();
      }

      ToastManager.noticeToast('Copied!');
    }
  };

  return (
    <Overlay in={show}>
      <AlertBackground>
        <h1>copy to...</h1>
        <p>where do you want to copy this asset?</p>

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

CopyToOverlay.propTypes = {
  show: PropTypes.bool,
  cancelClick: PropTypes.func,
  asset: PropTypes.object,
  profile: PropTypes.object,
  assetType: PropTypes.string
};
