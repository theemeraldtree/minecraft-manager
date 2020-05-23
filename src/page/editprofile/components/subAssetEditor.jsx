import React, { useState, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import transition from 'styled-transition-group';
import path from 'path';
import fs from 'fs';
import { Button, TextInput, InputHolder, Dropdown, withTheme } from '@theemeraldtree/emeraldui';
import ProfilesManager from '../../../manager/profilesManager';
import DiscoverList from '../../../component/discoverlist/discoverlist';
import AssetCard from '../../../component/assetcard/assetcard';
import Mod from '../../../type/mod';
import Global from '../../../util/global';
import AssetInfo from '../../../component/assetinfo/assetinfo';
import ToastManager from '../../../manager/toastManager';
import Hosts from '../../../host/Hosts';
import OMAFFileAsset from '../../../type/omafFileAsset';
import World from '../../../type/world';
import CopyToOverlay from './copyToOverlay';
import MoveToOverlay from './moveToOverlay';
import ErrorManager from '../../../manager/errorManager';
import useKeyPress from '../../../util/useKeyPress';
import AlertManager from '../../../manager/alertManager';

const { dialog } = require('electron').remote;

const Wrapper = styled.div`
  height: 100%;
  overflow: hidden;
  padding-right: 10px;
`;

const Container = styled.div`
  overflow: hidden;
  display: flex;
  flex-flow: column;
  height: calc(100vh - 80px);
`;

const List = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  &::-webkit-scrollbar-track {
    background: none;
  }
`;

const Search = styled(TextInput)`
  width: 100%;
  flex-shrink: 9999;
`;

const SearchContainer = styled(InputHolder)`
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

const FilterHeader = styled.div`
  margin-top: 5px;
  & > div {
    width: 130px;
  }
`;

function SubAssetEditor({ id, assetType, dpWorld, theme }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [profile, setProfile] = useState(ProfilesManager.getProfileFromID(id));
  const [progressState, setProgressState] = useState(profile.progressState);
  const [searchTerm, setSearchTerm] = useState('');
  const [liveSearchTerm, setLiveSearchTerm] = useState('');
  const [displayState, setDisplayState] = useState('assetsList');
  const [listState, setListState] = useState('browseAssets');
  const [activeAsset, setActiveAsset] = useState({});
  const [showCopyToOverlay, setShowCopyToOverlay] = useState(false);
  const [showMoveToOverlay, setShowMoveToOverlay] = useState(false);
  const [actionAsset, setActionAsset] = useState({});
  const [sortValue, setSortValue] = useState('a-z');
  const escPress = useKeyPress('Escape');

  let po;
  let selobj = profile;
  if (assetType === 'mod') {
    po = 'mods';
  } else if (assetType === 'resourcepack') {
    po = 'resourcepacks';
  } else if (assetType === 'world') {
    po = 'worlds';
  } else if (assetType === 'datapack') {
    po = 'datapacks';
    selobj = dpWorld;
  }

  const updateProgressStates = () => {
    setProgressState(profile.progressState);
    forceUpdate(); // necessary for some reason
  };

  const showInfoClick = e => {
    let mod;
    if (assetType !== 'datapack') {
      mod = profile.getSubAssetFromID(assetType, e.currentTarget.dataset.assetid);
    } else {
      mod = dpWorld.datapacks.find(dp => dp.id === e.currentTarget.dataset.assetid);
    }

    if (assetType === 'mod') {
      if (!(mod instanceof Mod)) {
        mod = new Mod(mod);
      }
    } else if (assetType === 'resourcepack' || assetType === 'datapack') {
      if (!(mod instanceof OMAFFileAsset)) {
        mod = new OMAFFileAsset(mod);
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

  const addFromFile = () => {
    let filterName, filterExtensions;
    if (assetType === 'mod') {
      filterName = 'Mod Files';
      filterExtensions = ['jar'];
    } else if (assetType === 'resourcepack') {
      filterName = 'Resource Packs';
      filterExtensions = ['zip'];
    } else if (assetType === 'datapack') {
      filterName = 'Datapacks';
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

      if (assetType === 'mod') {
        if (!fs.existsSync(profile.modsPath)) {
          fs.mkdirSync(profile.modsPath);
        }

        fs.copyFileSync(pth, path.join(profile.modsPath, path.basename(pth)));
      } else if (assetType === 'datapack') {
        if (!fs.existsSync(path.join(profile.gameDir, dpWorld.getMainFile().path, '/datapacks'))) {
          fs.mkdirSync(path.join(profile.gameDir, dpWorld.getMainFile().path, '/datapacks'));
        }

        fs.copyFileSync(
          pth,
          path.join(profile.gameDir, dpWorld.getMainFile().path, `/datapacks/${path.basename(pth)}`)
        );
      }

      Global.scanProfiles();

      // this is a *very* hacky fix
      // but if it ain't broke, don't fix it, right?
      setTimeout(() => {
        if (assetType === 'datapack') {
          updateProgressStates();
        }
      }, 500);
    }
  };

  const browseMods = () => {
    if (assetType !== 'datapack') {
      setDisplayState('addMods');
      setLiveSearchTerm('');
    } else {
      addFromFile();
    }
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
    try {
      profile.progressState[asset.id] = {
        progress: 'installing',
        version: `temp-${new Date().getTime()}`
      };

      updateProgressStates();
      const m = await Hosts.installAssetToProfile('curse', profile, asset, assetType);
      updateProgressStates();
      installErrorHandler(m, asset);
    } catch (err) {
      profile.progressState[asset.id] = {};
      updateProgressStates();
    }
  };

  const deleteClick = assetid => {
    if (assetType !== 'datapack') {
      const del = () => {
        const asset = profile.getSubAssetFromID(assetType, assetid);
        profile
          .deleteSubAsset(assetType, asset)
          .then(() => {
            // hacky fix
            setTimeout(() => {
              updateProgressStates();
            }, 100);
          })
          .catch(e => {
            ToastManager.createToast('Unable to delete', ErrorManager.makeReadable(e, 'subasset'));
          });
      };
      if (assetType === 'world') {
        AlertManager.alert('are you sure?', '', del, 'delete', 'cancel');
      } else {
        del();
      }
    } else {
      const asset = dpWorld.datapacks.find(dp => dp.id === assetid);
      dpWorld.deleteDatapack(profile, asset);
      updateProgressStates();
    }
  };

  const versionInstall = (version, asset) => {
    profile
      .deleteSubAsset(assetType, asset)
      .then(() => {
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
      })
      .catch(e => {
        ToastManager.createToast('Unable to install', ErrorManager.makeReadable(e, 'subasset'));
      });
  };

  const copyToClick = assetid => {
    setShowCopyToOverlay(true);
    setActionAsset(profile.getSubAssetFromID(assetType, assetid));
  };

  const moveToClick = assetid => {
    setShowMoveToOverlay(true);
    setActionAsset(profile.getSubAssetFromID(assetType, assetid));
  };

  const sortValueChange = value => {
    setSortValue(value);
  };

  const sortOptions = [
    {
      id: 'a-z',
      name: 'Name (A-Z)'
    },
    {
      id: 'z-a',
      name: 'Name (Z-A)'
    }
  ];

  useEffect(() => {
    if (escPress) {
      if (displayState === 'addMods') {
        if (listState === 'viewAsset') {
          setListState('browseAssets');
          return;
        }

        setDisplayState('assetsList');
      } else if (displayState === 'modInfo') {
        setDisplayState('assetsList');
      }
    }
  }, [escPress]);

  const reloadListener = () => {
    setProfile(ProfilesManager.getProfileFromID(id));
    forceUpdate();
  };

  useEffect(() => {
    ProfilesManager.registerReloadListener(reloadListener);
    return () => {
      ProfilesManager.unregisterReloadListener(reloadListener);
    };
  }, []);
  return (
    <>
      <Wrapper>
        <CopyToOverlay
          profile={profile}
          asset={actionAsset}
          show={showCopyToOverlay}
          assetType={assetType}
          cancelClick={() => setShowCopyToOverlay(false)}
        />
        <MoveToOverlay
          profile={profile}
          asset={actionAsset}
          show={showMoveToOverlay}
          assetType={assetType}
          cancelClick={() => {
            setShowMoveToOverlay(false);
            forceUpdate();
          }}
        />
        <Container>
          <SearchContainer>
            <AnimateButton in={displayState !== 'assetsList'} timeout={150} unmountOnExit onClick={goBack} color="red">
              ←
            </AnimateButton>
            {displayState !== 'assetsList' && displayState !== 'modInfo' && (
              <Search theme={theme} onChange={searchChange} onKeyPress={searchChange} placeholder="search curseforge" />
            )}

            {displayState === 'assetsList' && (
              <Search
                theme={theme}
                value={liveSearchTerm}
                onChange={searchChange}
                onKeyPress={searchChange}
                placeholder="search installed"
              />
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
              <FilterHeader>
                <Dropdown items={sortOptions} value={sortValue} onChange={sortValueChange} />
              </FilterHeader>
              <List>
                {selobj[po]
                  .sort((a, b) => {
                    if (a.name && b.name) {
                      if (sortValue === 'a-z') {
                        return a.name.localeCompare(b.name);
                      }
                      return b.name.localeCompare(a.name);
                    }
                    return true;
                  })
                  .map(asset => {
                    if (displayState === 'assetsList') {
                      if (!asset.name) {
                        return (
                          <AssetCard
                            progressState={progressState}
                            key="undefinedasset"
                            compact
                            asset={{
                              id: asset.id,
                              name: 'Undefined Asset',
                              version: { displayName: 'Something has gone wrong - please delete' }
                            }}
                            showDelete
                            deleteClick={deleteClick}
                          />
                        );
                      }
                      if (asset.name.toLowerCase().includes(liveSearchTerm.toLowerCase())) {
                        return (
                          <AssetCard
                            progressState={progressState}
                            key={asset.id}
                            asset={asset}
                            showDelete
                            onClick={showInfoClick}
                            deleteClick={deleteClick}
                            installed
                            copyToClick={copyToClick}
                            moveToClick={moveToClick}
                            compact
                          />
                        );
                      }
                    }

                    return <></>;
                  })}
                {selobj[po].length === 0 && (
                  <>
                    <h1 style={{ textAlign: 'center' }}>There's nothing here!</h1>
                  </>
                )}
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
                profileID={id}
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
  assetType: PropTypes.string.isRequired,
  dpWorld: PropTypes.object,
  theme: PropTypes.object
};

export default withTheme(SubAssetEditor);
