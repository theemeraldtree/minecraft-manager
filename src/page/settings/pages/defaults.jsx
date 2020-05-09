import React, { useReducer } from 'react';
import InputContainer from '../../editprofile/components/inputcontainer';
import Checkbox from '../../../component/checkbox/checkbox';
import Detail from '../../../component/detail/detail';
import SettingsManager from '../../../manager/settingsManager';
import Section from '../components/section';

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
      <Section>
        <h3>Sync Options</h3>
        <InputContainer>
          <Checkbox
            checked={SettingsManager.currentSettings.defaultsSyncOptionsTXT}
            lighter
            onClick={() => toggleItem('defaultsSyncOptionsTXT')}
          />
          <Detail>Sync in-game Minecraft Options</Detail>
        </InputContainer>
        <InputContainer>
          <Checkbox
            checked={SettingsManager.currentSettings.defaultsSyncOptionsOF}
            lighter
            onClick={() => toggleItem('defaultsSyncOptionsOF')}
          />
          <Detail>Sync in-game OptiFine Options</Detail>
        </InputContainer>
        <InputContainer>
          <Checkbox
            checked={SettingsManager.currentSettings.defaultsSyncServers}
            lighter
            onClick={() => toggleItem('defaultsSyncServers')}
          />
          <Detail>Sync in-game server list</Detail>
        </InputContainer>
      </Section>
    </>
  );
}
