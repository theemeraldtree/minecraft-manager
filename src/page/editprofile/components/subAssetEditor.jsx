import React, { useState, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled, { css, keyframes } from 'styled-components';
import transition from 'styled-transition-group';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { Button, TextInput, Dropdown, withTheme } from '@theemeraldtree/emeraldui';
import ProfilesManager from '../../../manager/profilesManager';
import DiscoverList from '../../../component/discoverlist/discoverlist';
import AssetCard from '../../../component/assetcard/assetcard';
import Mod from '../../../type/mod';
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
import FSU from '../../../util/fsu';
import Scanner from '../../../util/scanner/scanner';
import DragAndDrop from './dragAndDrop';
import logInit from '../../../util/logger';
import useDebounced from '../../../util/useDebounced';


const Wrapper = styled.div`
  height: 100%;
  overflow: hidden;
  padding-right: 10px;
`;

const Container = styled.div`
  overflow: hidden;
  display: flex;
  flex-flow: column;
  height: calc(100vh - 97px);
  position: relative;
  padding-top: 10px;
`;

const List = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  & > div {
    overflow-y: auto;
  }
  &::-webkit-scrollbar-track {
    background: none;
  }
`;

const Search = styled(TextInput)`
  border-radius: 10px;
  font-size: 13pt;
`;

const ListHeader = styled.div`
  flex-shrink: 0;
  background-color: #353535;
  overflow: hidden;
  padding: 10px;
  display: flex;
  align-items: center;

  > div {
    display: inline-block;
  }

  > div.buttons {
    flex: 1 1 auto;
  }
`;

const SectionButton = styled.button`
  font-size: 15pt;
  padding: 5px;
  border-radius: 5px;
  background: transparent;
  color: #c7c7c7;
  border: 0;
  margin-right: 5px;
  cursor: pointer;
  transition: 150ms;
  &:hover {
    color: white;
  }
  ${props => props.active && css`
    background: #545454;
    color: white;
  `}
`;

const FilterHeader = styled.div`
  margin-top: 5px;
  & > div {
    width: 130px;
  }
`;

const buttonSlideIn = keyframes`
  0% {
    margin-left: -49px;
  }
  100% {
    margin-left: 0;
  }
`;

const buttonSlideOut = keyframes`
  0% {
    margin-left: 0;
  }
  100% {
    margin-left: -49px;
  }
`;

const AnimateButton = transition(Button)`
  animation: ${buttonSlideIn} 150ms forwards;
  margin-right: 10px;
  &:exit {
    animation: ${buttonSlideOut} 150ms forwards;
  }
`;

const logger = logInit('SubAssetEditor');

function SubAssetEditor({ id, assetType, dpWorld, theme }) {
  const [forceUpdateNumber, forceUpdate] = useReducer(x => x + 1, 0);
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
  const [deletingAssets, setDeletingAssets] = useState([]);
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

  const reloadListener = () => {
    setProfile(ProfilesManager.getProfileFromID(id));
    forceUpdate();
  };

  const scanDebounce = useDebounced(async () => {
    await Scanner.scanProfile(profile);
  }, 500);

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
    if (displayState === 'modInfo') {
      setDisplayState('assetsList');
    } else if (displayState === 'addMods' && listState === 'viewAsset') {
      setListState('browseAssets');
    }
  };

  const addFile = filePath => new Promise(async (resolve, reject) => {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);


    if (assetType === 'mod') {
      if (ext !== '.jar') {
        ToastManager.noticeToast('Invalid Filetype!');
        reject(new Error('Invalid Filetype'));
      } else {
        FSU.createDirIfMissing(profile.modsPath);

        profile.addSubAsset('mod', await Scanner.mods.scanMod(profile, filePath));

        fs.copyFileSync(filePath, path.join(profile.modsPath, fileName));

        resolve();
      }
    } else if (assetType === 'datapack') {
      FSU.createDirIfMissing(path.join(profile.gameDir, dpWorld.getMainFile().path, '/datapacks'));

      fs.copyFileSync(
        filePath,
        path.join(profile.gameDir, dpWorld.getMainFile().path, `/datapacks/${fileName}`)
      );

      await Scanner.datapacks.scanProfile(profile);

      resolve();
    } else if (assetType === 'world') {
      if (fs.lstatSync(filePath).isDirectory() || ext === '.zip') {
        FSU.createDirIfMissing(path.join(profile.gameDir, '/saves'));
        await Scanner.worlds.importWorld(profile, filePath, true);

        resolve();
      } else {
        ToastManager.noticeToast('Invalid Filetype!');
        reject(new Error('Invalid Filetype'));
      }
    } else if (assetType === 'resourcepack') {
      if (fs.lstatSync(filePath).isDirectory() || ext === '.zip') {
        FSU.createDirIfMissing(path.join(profile.gameDir), '/resourcepacks');

        profile.addSubAsset(
          'resourcepack',
          await Scanner.resourcepacks.scanResourcePack(profile, filePath)
        );

        await FSU.copyDir(
          filePath,
          path.join(profile.gameDir, `/resourcepacks/${fileName}`)
        );

        resolve();
      } else {
        ToastManager.noticeToast('Invalid Filetype!');
        reject(new Error('Invalid Filetype'));
      }
    }
  });

  // const addFromFile = async () => {
  //   let filterName, filterExtensions;
  //   if (assetType === 'mod') {
  //     filterName = 'Mod Files';
  //     filterExtensions = ['jar'];
  //   } else if (assetType === 'resourcepack') {
  //     filterName = 'Resource Packs';
  //     filterExtensions = ['zip'];
  //   } else if (assetType === 'datapack') {
  //     filterName = 'Datapacks';
  //     filterExtensions = ['zip'];
  //   }

  //   const p = dialog.showOpenDialogSync({
  //     title: 'Choose your file',
  //     buttonLabel: 'Choose File',
  //     properties: ['openFile'],
  //     filters: [
  //       { name: filterName, extensions: filterExtensions },
  //       { name: 'All Files', extensions: ['*'] }
  //     ]
  //   });

  //   if (p && p[0]) {
  //     try {
  //       await addFile(p[0]);
  //       reloadListener();
  //       ToastManager.noticeToast('Added from file!');
  //     } catch (e) {
  //       if (e) {
  //         logger.error(`Error adding file manually: ${e.message}`);
  //       }
  //     }
  //   }
  // };

  // const browseMods = () => {
  //   if (assetType !== 'datapack') {
  //     setDisplayState('addMods');
  //     setLiveSearchTerm('');
  //   } else {
  //     addFromFile();
  //   }
  // };

  const searchChange = e => {
    const term = e.target.value;
    setLiveSearchTerm(term);
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
        setDeletingAssets([...deletingAssets, assetid]);

        const asset = profile.getSubAssetFromID(assetType, assetid);

        // wait for animation to complete
        setTimeout(() => {
          profile
            .deleteSubAsset(assetType, asset)
            .then(() => {
                setDeletingAssets(deletingAssets.splice(deletingAssets.indexOf(asset.id), 1));
                updateProgressStates();
            })
            .catch(e => {
              ToastManager.createToast('Unable to delete', ErrorManager.makeReadable(e, 'subasset'));
            });
        }, 100);
      };
      if (assetType === 'world') {
        AlertManager.alert('are you sure?', '', del, 'delete', 'cancel');
      } else {
        del();
      }
    } else {
      setDeletingAssets([...deletingAssets, assetid]);

      // wait for animation
      setTimeout(() => {
        const asset = dpWorld.datapacks.find(dp => dp.id === assetid);
        dpWorld.deleteDatapack(profile, asset);
        updateProgressStates();
        setDeletingAssets(deletingAssets.splice(deletingAssets.indexOf(asset.id), 1));
      }, 100);
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


  useEffect(() => {
    ProfilesManager.registerReloadListener(reloadListener);

    let pathToWatch;
    if (assetType === 'mod') {
      pathToWatch = path.join(profile.gameDir, '/mods/');
    } else if (assetType === 'world') {
      pathToWatch = path.join(profile.gameDir, '/saves/');
    } else if (assetType === 'resourcepacks') {
      pathToWatch = path.join(profile.gameDir, '/resourcepacks');
    }

    const watcher = chokidar.watch(pathToWatch, {
      depth: 0
    });

    watcher.on('all', () => {
      scanDebounce();
    });

    return () => {
      ProfilesManager.unregisterReloadListener(reloadListener);
      watcher.close();
    };
  }, []);

  const fileDrop = (files) => {
    files.forEach(async file => {
      if (fs.existsSync(file.path)) {
        try {
          await addFile(file.path);
          reloadListener();
        } catch (e) {
          if (e) {
            logger.error(`Error drag-and-dropping file: ${e.message}`);
          }
        }
      }
    });
  };

  const showAssetsList = () => {
    setListState('browseAssets');
    setDisplayState('assetsList');
    setLiveSearchTerm('');
  };

  const showDiscover = () => {
    setListState('browseAssets');
    setDisplayState('addMods');
    setLiveSearchTerm('');
  };

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
          <ListHeader>

            <AnimateButton in={listState === 'viewAsset' || displayState === 'modInfo'} timeout={500} unmountOnExit onClick={goBack} color="red">
              ←
            </AnimateButton>
            <div className="buttons">
              <SectionButton onClick={showAssetsList} active={displayState === 'assetsList'}>
                Installed
              </SectionButton>
              <SectionButton onClick={showDiscover} active={displayState === 'addMods' && listState === 'browseAssets'}>
                Discover
              </SectionButton>
            </div>
            {
              displayState !== 'modInfo' && (
                <div>
                  <Search theme={theme} value={liveSearchTerm} onChange={searchChange} onKeyPress={searchChange} placeholder={displayState === 'assetsList' ? 'Search installed...' : 'Search CurseForge...'} />
                </div>
              )
            }
          </ListHeader>
          {displayState === 'assetsList' && (
            <>
              <FilterHeader>
                <Dropdown items={sortOptions} value={sortValue} onChange={sortValueChange} />
              </FilterHeader>
              <List>
                <DragAndDrop onDrop={fileDrop}>
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
                  .filter(asset => asset.name.toLowerCase().includes(liveSearchTerm.toLowerCase()))
                  .map(asset => {
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
                          shrink={deletingAssets.includes(asset.id)}
                        />
                      );
                  })}
                </DragAndDrop>
                {selobj[po].length === 0 && (
                  <>
                    <h1 style={{ textAlign: 'center' }}>There's nothing here!</h1>
                    <p style={{ textAlign: 'center', fontSize: '13pt' }}>Install mods from CurseForge in <b>Discover</b>,<br />
                      or drag and drop files here.
                    </p>
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
              forceUpdate={forceUpdateNumber}
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
