import React, { useState, useEffect, useContext, useReducer } from 'react';
import DiscoverList from '../../component/discoverlist/discoverlist';
import ProfilesManager from '../../manager/profilesManager';
import Hosts from '../../host/Hosts';
import NavContext from '../../navContext';
import SearchBox from '../../component/searchbox/searchbox';

export default function DiscoverPage() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

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
    const cachedID = e.currentTarget.parentElement.parentElement.dataset.cachedid;
    const modpack = Hosts.cache.assets[cachedID];
    ProfilesManager.progressState[modpack.id] = {
      progress: 'installing',
      version: `temp-${new Date().getTime()}`
    };
    updateProgressStates();
    await Hosts.installModpack('curse', modpack);
    ProfilesManager.getProfiles().then(() => {
      updateProgressStates();
    });
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
    header.setTitle('discover');
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
        placeholder="search curseforge"
      />
    );
  }, [searchValue]);

  return (
    <>
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
      />
    </>
  );
}
