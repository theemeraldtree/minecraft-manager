import React from 'react';
import PropTypes from 'prop-types';
import fs from 'fs';
import path from 'path';
import { Button } from '@theemeraldtree/emeraldui';
import Overlay from '../../../component/overlay/overlay';
import AlertBackground from '../../../component/alert/alertbackground';
import ProfileSelector from '../../../component/profileSelector/profileSelector';
import FSU from '../../../util/fsu';
import ToastManager from '../../../manager/toastManager';
import modVersionCheck from './modVersionCheck';
import logInit from '../../../util/logger';

const logger = logInit('MoveToOverlay');

export default function MoveToOverlay({ show, profile, asset, assetType, cancelClick }) {
  const onSelect = newProfile => {
    if ((assetType === 'mod' && modVersionCheck(profile, newProfile, asset)) || assetType !== 'mod') {
      logger.info(`Moving ${asset.id} from ${profile.id} to ${newProfile.id}`);
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
        <h1>Move to...</h1>
        <p>Where do you want to move <b>{asset.name}</b> to?</p>

        <ProfileSelector hideProfile={profile.id} onSelect={onSelect} />

        <div className="buttons">
          <Button color="#444" onClick={cancelClick}>
            Cancel
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
