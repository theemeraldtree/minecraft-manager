import React, { useState, useContext, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { Button, TextInput, Detail } from '@theemeraldtree/emeraldui';
import styled from 'styled-components';
import SearchBox from '../../component/searchbox/searchbox';
import ProfileGrid from './components/profilegrid';
import ProfilesManager from '../../manager/profilesManager';
import Overlay from '../../component/overlay/overlay';
import Global from '../../util/global';
import ImportOverlay from '../../component/importoverlay/importoverlay';
import NavContext from '../../navContext';
import AlertBackground from '../../component/alert/alertbackground';
import MCVersionSelector from '../../component/mcVersionSelector/mcVersionSelector';

const CreateBG = styled(AlertBackground)`
  max-width: 600px;
  max-height: 400px;
  width: 100%;
  height: 100%;
  background-color: #222;
  color: white;
  padding: 10px;
  position: relative;
  margin: 20px;
`;

const Title = styled.p`
  font-weight: 300;
  margin: 0;
  font-size: 23pt;
`;

const CreateControls = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  button {
    margin: 2px;
  }
`;

export default withRouter(({ history }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [nameEntered, setNameEntered] = useState(false);
  const [mcVersion, setMCCVersion] = useState(Global.MC_VERSIONS[0]);
  const [showImport, setShowImport] = useState(false);

  const { header } = useContext(NavContext);

  useEffect(() => {
    header.setShowBackButton(false);
    header.setTitle('profiles');
    header.setShowChildren(true);
  }, []);

  useEffect(() => {
    header.setChildren(
      <>
        <SearchBox
          value={searchTerm}
          type="text"
          onChange={e => setSearchTerm(e.target.value.toLowerCase())}
          placeholder="search"
        />
        <Button onClick={() => setShowImport(true)} color="purple">
          import
        </Button>
        <Button onClick={() => setShowCreate(true)} color="green">
          create
        </Button>
      </>
    );
  }, [searchTerm]);

  const createNameChange = e => {
    const input = e.target.value;
    const names = ProfilesManager.loadedProfiles.map(prof => prof.id);
    if (input.trim() !== '' && !names.includes(Global.createID(input))) {
      setNameEntered(true);
    } else {
      setNameEntered(false);
    }
    setCreateName(input);
  };

  const create = () => {
    ProfilesManager.createProfile(createName, mcVersion).then(() => {
      history.push(`/profile/${Global.createID(createName)}`);
    });
  };

  return (
    <>
      <ProfileGrid searchTerm={searchTerm} />
      <ImportOverlay in={showImport} cancelClick={() => setShowImport(false)} />
      <Overlay in={showCreate}>
        <CreateBG>
          <Title>create a new profile</Title>
          <Detail>profile name</Detail>
          <TextInput onChange={createNameChange} />
          <Detail>minecraft version</Detail>
          <MCVersionSelector value={mcVersion} onChange={ver => setMCCVersion(ver)} />

          <Detail>looking to download a modpack? head to the discover section on the sidebar</Detail>
          <CreateControls>
            <Button onClick={() => setShowCreate(false)} color="red">
              cancel
            </Button>
            <Button disabled={!nameEntered} onClick={create} color="green">
              create
            </Button>
          </CreateControls>
        </CreateBG>
      </Overlay>
    </>
  );
});
