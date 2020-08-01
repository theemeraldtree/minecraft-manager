import React, { useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import EditPageGeneral from './general/editpagegeneral';
import Sidebar from './components/sidebar';
import EditPageVersion from './version/editpageversion';
import NavContext from '../../navContext';
import EditPageMods from './mods/editpagemods';
import EditPageSettings from './settings/editpagesettings';
import EditPageResourcePacks from './resourcepacks/editpageresourcepacks';
import ProfilesManager from '../../manager/profilesManager';
import EditPageWorlds from './worlds/editpageworlds';
import HeaderInstanceLabel from '../../component/headerInstanceLabel/headerInstanceLabel';

const BG = styled.div`
  position: relative;
  flex: 1 1 auto;
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const CC = styled.div`
  margin-left: 130px;
  color: white;
  overflow-y: auto;
  flex: 1 1 auto;
  &::-webkit-scrollbar-track {
    background: none;
  }
`;

function EditPage({ history, match }) {
  const { header } = useContext(NavContext);

  const { params } = match;
  const { page, id } = params;

  const profile = ProfilesManager.getProfileFromID(id);

  useEffect(() => {
    header.setTitle('EDITING');
    header.setShowChildren(true);
    header.setChildren(<HeaderInstanceLabel
      left={185}
      instance={ProfilesManager.getProfileFromID(id)}
      onSwitch={inst => {
        history.push(`/rr-edit-hack/${page}/${inst.id}`);
        setTimeout(() => {
          history.replace(`/edit/general/${inst.id}`);
        });
      }}
    />);
    header.setBackLink(`/profile/${profile.id}`);
    header.setShowBackButton(true);
  }, [profile]);

  return (
    <BG>
      <Sidebar isDefaultProfile={profile.isDefaultProfile} id={profile.id} />
      <CC>
        {page === 'general' && <EditPageGeneral id={profile.id} />}
        {page === 'version' && <EditPageVersion id={profile.id} />}
        {page === 'mods' && <EditPageMods id={profile.id} />}
        {page === 'resourcepacks' && <EditPageResourcePacks id={profile.id} />}
        {page === 'worlds' && <EditPageWorlds id={profile.id} />}
        {page === 'settings' && <EditPageSettings id={profile.id} />}
      </CC>
    </BG>
  );
}

export default withRouter(EditPage);

EditPage.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object
};
