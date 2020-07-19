import React, { useState, useEffect, useContext, useReducer } from 'react';
import styled from 'styled-components';
import DiscoverList from '../../component/discoverlist/discoverlist';
import ProfilesManager from '../../manager/profilesManager';
import Hosts from '../../host/Hosts';
import NavContext from '../../navContext';
import SearchBox from '../../component/searchbox/searchbox';
import ToastManager from '../../manager/toastManager';

const Container = styled.div`
  width: calc(100% - 20px);
  padding-left: 10px;
  padding-bottom: 0;
  height: 100%;
  display: flex;
  flex-flow: column;
`;

export default function DiscoverPage() {
  const [forceUpdateNumber, forceUpdate] = useReducer(x => x + 1, 0);

  const { header } = useContext(NavContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [listState, setListState] = useState('browseAssets');
  const [progressState, setProgressState] = useState({});

  const searchChange = e => {
    const term = e.target.value;
    setSearchValue(term);
    if (e.key === 'Enter') {
      setSearchTerm(term);
    }
  };

  function backClick() {
    setListState('browseAssets');
  }

  const updateProgressStates = () => {
    setProgressState(ProfilesManager.progressState);
    forceUpdate();
  };

  const installClick = async e => {
    e.stopPropagation();
    if (!Hosts.currentlyInstallingModpack) {
      const cachedID = e.currentTarget.parentElement.parentElement.dataset.cachedid;
      const modpack = Hosts.cache.assets[cachedID];
      ProfilesManager.progressState[modpack.id] = {
        progress: 'installing',
        version: `temp-${new Date().getTime()}`
      };
      Hosts.currentlyInstallingModpack = true;
      updateProgressStates();
      await Hosts.installModpack('curse', modpack);
      Hosts.currentlyInstallingModpack = false;
      ProfilesManager.getProfiles().then(() => {
        updateProgressStates();
      });
    } else {
      ToastManager.createToast('Slow down!', 'You\'re already downloading a modpack. You can only download one at a time.');
    }
  };

  const versionInstall = async (version, mp) => {
    ProfilesManager.progressState[mp.id] = {
      progress: 'installing',
      version: version.displayName
    };
    updateProgressStates();
    await Hosts.installModpackVersion('curse', mp, version.hosts.curse.fileID);
    ProfilesManager.getProfiles().then(() => {
      updateProgressStates();
    });
  };

  useEffect(() => {
    ProfilesManager.registerReloadListener(updateProgressStates);
    updateProgressStates();

    header.setOnBackClick(backClick);
    header.setTitle('DISCOVER MODPACKS');
    header.setShowBackButton(false);
    header.setBackLink(undefined);
    header.setShowChildren(true);
  }, []);

  useEffect(() => {
    header.setShowBackButton(listState !== 'browseAssets');
    header.setShowChildren(listState === 'browseAssets');
  }, [listState]);

  useEffect(() => {
    header.setChildren(
      <SearchBox
        type="text"
        value={searchValue}
        onChange={searchChange}
        onKeyPress={searchChange}
        placeholder="Search CurseForge..."
        rounded
      />
    );
  }, [searchValue]);

  return (
    <Container>
      <DiscoverList
        host="curse"
        mcVerFilter="All"
        versionInstall={versionInstall}
        progressState={progressState}
        stateChange={setListState}
        state={listState}
        type="profile"
        installClick={installClick}
        searchTerm={searchTerm}
        forceUpdate={forceUpdateNumber}
      />
    </Container>
  );
}
