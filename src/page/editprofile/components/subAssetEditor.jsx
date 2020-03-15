import React, { useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import transition from 'styled-transition-group';
import path from 'path';
import fs from 'fs';
import ProfilesManager from '../../../manager/profilesManager';
import TextInput from '../../../component/textinput/textinput';
import Button from '../../../component/button/button';
import DiscoverList from '../../../component/discoverlist/discoverlist';
import InputContainer from './inputcontainer';
import AssetCard from '../../../component/assetcard/assetcard';
import Mod from '../../../type/mod';
import Global from '../../../util/global';
import AssetInfo from '../../../component/assetinfo/assetinfo';
import ToastManager from '../../../manager/toastManager';
import Hosts from '../../../host/Hosts';
import GenericAsset from '../../../type/genericAsset';
import World from '../../../type/world';

const { dialog } = require('electron').remote;

const Wrapper = styled.div`
  height: 100%;
  overflow: hidden;
`;

const Container = styled.div`
  background-color: #2b2b2b;
  overflow: hidden;
  padding: 10px;
  display: flex;
  flex-flow: column;
  height: 100%;
`;

const List = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  margin-top: 10px;
  margin-bottom: 20px;
  padding: 10px;
`;

const Search = styled(TextInput)`
  width: 100%;
  flex-shrink: 9999;
`;

const SearchContainer = styled(InputContainer)`
  margin-top: 10px;
  flex-shrink: 0;
  background-color: #404040;
  overflow: hidden;
`;

const AnimateButton = transition(Button)`
    &:enter {
        margin-left: -39px;
    }
    &:enter-active {
        margin-left: 0;
        transition: margin-left 150ms;
    }
    &:exit {
        margin-left: 0;
    }
    &:exit-active {
        margin-left: -39px;
        transition: margin-left 150ms;
    }
`;

export default function SubAssetEditor({ id, assetType }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [profile] = useState(ProfilesManager.getProfileFromID(id));
  const [progressState, setProgressState] = useState(profile.progressState);
  const [searchTerm, setSearchTerm] = useState('');
  const [liveSearchTerm, setLiveSearchTerm] = useState('');
  const [displayState, setDisplayState] = useState('assetsList');
  const [listState, setListState] = useState('browseAssets');
  const [activeAsset, setActiveAsset] = useState({});

  let po;
  if (assetType === 'mod') {
    po = 'mods';
  } else if (assetType === 'resourcepack') {
    po = 'resourcepacks';
  } else if (assetType === 'world') {
    po = 'worlds';
  }

  const updateProgressStates = () => {
    setProgressState(profile.progressState);
    forceUpdate(); // necessary for some reason
  };

  const showInfoClick = e => {
    let mod = profile.getSubAssetFromID(assetType, e.currentTarget.dataset.assetid);
    if (assetType === 'mod') {
      if (!(mod instanceof Mod)) {
        mod = new Mod(mod);
      }
    } else if (assetType === 'resourcepack') {
      if (!(mod instanceof GenericAsset)) {
        mod = new GenericAsset(mod);
      }
    } else if (assetType === 'world') {
      if (!(mod instanceof World)) {
        mod = new World(mod);
      }
    }

    if (!progressState[mod.id]) {
      const copy = { ...progressState };
      copy[mod.id] = {
        progress: 'installed',
        version: mod.version.displayName
      };
      setProgressState(copy);
      profile.progressState = copy;
    }

    setDisplayState('modInfo');
    setActiveAsset(mod);
  };

  const goBack = () => {
    if (listState === 'browseAssets') {
      setDisplayState('assetsList');
      setLiveSearchTerm('');
    } else {
      let newState;
      if (listState === 'viewAsset') {
        newState = 'browseAssets';
      }
      setListState(newState);
    }
  };

  const browseMods = () => {
    setDisplayState('addMods');
    setLiveSearchTerm('');
  };

  const searchChange = e => {
    const term = e.target.value;
    if (displayState === 'assetsList') {
      setLiveSearchTerm(term);
    }
    if (e.key === 'Enter') {
      setSearchTerm(term);
      setListState('browseAssets');
    }
  };

  const installErrorHandler = (m, asset) => {
    const assetID = asset.id;

    if (m === 'no-version-available') {
      if (assetType === 'mod') {
        let modloader;
        if (profile.frameworks.forge) {
          modloader = 'Forge';
        } else if (profile.frameworks.fabric) {
          modloader = 'Fabric';
        } else {
          modloader = 'none';
        }

        if (modloader !== 'none') {
          profile.progressState[assetID].progress = 'notavailable';
          ToastManager.createToast(
            'Unavailable',
            `There is no ${modloader}-compatible Minecraft ${profile.version.minecraft.version} version of ${asset.name} available.`
          );

          updateProgressStates();
        } else {
          if (profile.progressState[assetID]) profile.progressState[assetID].progress = '';
          ToastManager.createToast(
            'No modloader',
            "You don't have a modloader installed. Install one in the versions tab first."
          );

          updateProgressStates();
        }
      } else {
        profile.progressState[assetID].progress = 'notavailable';
        ToastManager.createToast(
          'Unavailable',
          `There is no ${profile.version.minecraft.version}-compatible version of ${asset.name}`
        );
      }

      updateProgressStates();
    }
  };

  const installClick = async e => {
    e.stopPropagation();
    const cachedID = e.currentTarget.parentElement.parentElement.dataset.cachedid;
    const asset = Hosts.cache.assets[cachedID];

    profile.progressState[asset.id] = {
      progress: 'installing',
      version: `temp-${new Date().getTime()}`
    };

    updateProgressStates();
    const m = await Hosts.installAssetToProfile('curse', profile, asset, assetType);
    updateProgressStates();
    installErrorHandler(m, asset);
  };

  const deleteClick = assetid => {
    const asset = profile.getSubAssetFromID(assetType, assetid);
    profile.deleteSubAsset(assetType, asset).then(() => {
      updateProgressStates();
    });
  };

  const addFromFile = () => {
    let filterName, filterExtensions;
    if (assetType === 'mod') {
      filterName = 'Mod Files';
      filterExtensions = ['jar'];
    } else if (assetType === 'resourcepack') {
      filterName = 'Resource Packs';
      filterExtensions = ['zip'];
    }

    const p = dialog.showOpenDialog({
      title: 'Choose your file',
      buttonLabel: 'Choose File',
      properties: ['openFile'],
      filters: [
        { name: filterName, extensions: filterExtensions },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (p && p[0]) {
      const pth = p[0];
      if (!fs.existsSync(profile.modsPath)) {
        fs.mkdirSync(profile.modsPath);
      }

      fs.copyFileSync(pth, path.join(profile.modsPath, path.basename(pth)));
      Global.scanProfiles();
    }
  };

  const versionInstall = (version, asset) => {
    profile.deleteSubAsset(assetType, asset).then(() => {
      profile.progressState[asset.id] = {
        progress: 'installing',
        version: version.displayName
      };
      updateProgressStates();
      const newAsset = { ...asset };
      newAsset.version = version;
      newAsset.hosts.curse.fileID = version.hosts.curse.fileID;
      Hosts.installAssetVersionToProfile('curse', profile, newAsset, assetType, true).then(m => {
        updateProgressStates();
        installErrorHandler(m, asset);
      });
    });
  };

  return (
    <>
      <Wrapper>
        <Container>
          <SearchContainer>
            <AnimateButton in={displayState !== 'assetsList'} timeout={150} unmountOnExit onClick={goBack} color="red">
              ←
            </AnimateButton>
            {displayState !== 'assetsList' && displayState !== 'modInfo' && (
              <Search onChange={searchChange} onKeyPress={searchChange} placeholder="Search" />
            )}

            {displayState === 'assetsList' && (
              <Search value={liveSearchTerm} onChange={searchChange} onKeyPress={searchChange} placeholder="Search" />
            )}
            {displayState === 'addMods' && listState !== 'viewAsset' && (
              <Button timeout={150} unmountOnExit onClick={addFromFile} color="green">
                from file
              </Button>
            )}
            {displayState === 'assetsList' && (
              <Button timeout={150} unmountOnExit onClick={browseMods} color="green">
                add
              </Button>
            )}
          </SearchContainer>
          {displayState === 'assetsList' && (
            <>
              <List>
                {profile[po].map(asset => {
                  if (displayState === 'assetsList') {
                    if (asset.name.toLowerCase().includes(liveSearchTerm.toLowerCase())) {
                      return (
                        <AssetCard
                          progressState={progressState}
                          key={asset.id}
                          asset={asset}
                          showDelete
                          onClick={showInfoClick}
                          deleteClick={deleteClick}
                        />
                      );
                    }
                  }

                  return <></>;
                })}
              </List>
            </>
          )}
          {displayState === 'modInfo' && (
            <>
              <AssetInfo
                host={activeAsset.getPrimaryHost()}
                allowVersionReinstallation
                forceFramework={profile.getPrimaryFramework()}
                specificMCVer={profile.version.minecraft.version}
                progressState={progressState[activeAsset.id]}
                versionInstall={versionInstall}
                forceVersionFilter
                mcVerFilter={profile.version.minecraft.version}
                asset={activeAsset}
                displayState={progressState}
                type={assetType}
                localAsset
              />
            </>
          )}
          {displayState === 'addMods' && (
            <DiscoverList
              host="curse"
              allowVersionReinstallation
              specificMCVer={profile.version.minecraft.version}
              disableVersionInstall
              versionInstall={versionInstall}
              forceVersionFilter
              mcVerFilter={profile.version.minecraft.version}
              progressState={progressState}
              type={assetType}
              installClick={installClick}
              searchTerm={searchTerm}
              state={listState}
              stateChange={setListState}
              forceFramework={profile.getPrimaryFramework()}
            />
          )}
        </Container>
      </Wrapper>
    </>
  );
}

SubAssetEditor.propTypes = {
  id: PropTypes.string.isRequired,
  assetType: PropTypes.string.isRequired
};
