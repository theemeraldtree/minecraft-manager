import React, { useReducer } from 'react';
import styled from 'styled-components';
import InputContainer from '../../editprofile/components/inputcontainer';
import Checkbox from '../../../component/checkbox/checkbox';
import Detail from '../../../component/detail/detail';
import SettingsManager from '../../../manager/settingsManager';

const Panel = styled.div`
  background-color: #2b2b2b;
  padding: 10px;
  width: 380px;
  margin-bottom: 5px;

  h3 {
    margin: 0;
  }

  & > div {
    margin-top: 5px;
  }
`;

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
      <Panel>
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
      </Panel>
    </>
  );
}
