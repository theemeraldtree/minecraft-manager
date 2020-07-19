import React, { useReducer } from 'react';
import { Detail, InputHolder } from '@theemeraldtree/emeraldui';
import SettingsManager from '../../../manager/settingsManager';
import ToggleSwitch from '../../../component/toggleSwitch/toggleSwitch';
import SettingSeperator from '../../../component/settingSeparator/settingSeparator';
import Gap from '../components/gap';
import ProfilesManager from '../../../manager/profilesManager';
import Description from '../components/description';
import MCLauncherIntegrationHandler from '../../../minecraft/mcLauncherIntegrationHandler';

function General() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const toggleSetting = setting => {
    SettingsManager.currentSettings[setting] = !SettingsManager.currentSettings[setting];
    SettingsManager.save();
    forceUpdate();
  };

  return (
    <>
      <Gap />

      <InputHolder vertical>
        <div>

          <ToggleSwitch
            value={SettingsManager.currentSettings.allowSnapshotProfile}
            onClick={() => {
            toggleSetting('allowSnapshotProfile');
            MCLauncherIntegrationHandler.updateSnapshotEnabled();
            ProfilesManager.getProfiles();
          }}
          />
          <Detail>Show Latest Snapshot Profile</Detail>
        </div>
        <Description>
          Enables the Latest Snapshot Profile, which runs the latest Minecraft Snapshot. Snapshots may be unstable and contain bugs.
        </Description>
      </InputHolder>

      <SettingSeperator />

      <InputHolder vertical>
        <div>

          <ToggleSwitch
            value={SettingsManager.currentSettings.checkToastNews}
            onClick={() => toggleSetting('checkToastNews')}
          />
          <Detail>Check for News Snippets on startup</Detail>
        </div>
        <Description>
          News snippets may include Minecraft Manager news or fun announcements.
        </Description>
      </InputHolder>

      <SettingSeperator />

      <InputHolder vertical>
        <div>

          <ToggleSwitch
            value={SettingsManager.currentSettings.closeOnLaunch}
            onClick={() => toggleSetting('closeOnLaunch')}
          />
          <Detail>Close Minecraft Manager on profile launch</Detail>
        </div>
        <Description>
          The Minecraft Manager window will be closed when you launch a Profile.
        </Description>
      </InputHolder>
    </>
  );
}

export default General;
