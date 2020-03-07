import React, { useReducer } from 'react';
import InputContainer from '../../editprofile/components/inputcontainer';
import Checkbox from '../../../component/checkbox/checkbox';
import Detail from '../../../component/detail/detail';
import SettingsManager from '../../../manager/settingsManager';

export default function Defaults() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const toggleItem = function(item) {
    SettingsManager.currentSettings[item] = !SettingsManager.currentSettings[item];
    SettingsManager.save();
    forceUpdate();
  };

  return (
    <>
      <p>
        The following are default settings that are used for <b>new</b> profiles only
      </p>
      <InputContainer>
        <Checkbox
          checked={SettingsManager.currentSettings.defaultsShowTutorial}
          lighter
          onClick={() => toggleItem('defaultsShowTutorial')}
        />
        <Detail>Show tutorial in top right corner</Detail>
      </InputContainer>
      <InputContainer>
        <Checkbox
          checked={SettingsManager.currentSettings.defaultsAutoJump}
          lighter
          onClick={() => toggleItem('defaultsAutoJump')}
        />
        <Detail>Auto-jump</Detail>
      </InputContainer>
    </>
  );
}
