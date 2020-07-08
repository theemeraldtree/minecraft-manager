import React, { useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import EditPageGeneral from './general/editpagegeneral';
import Sidebar from './components/sidebar';
import EditPageVersions from './versions/editpageversions';
import NavContext from '../../navContext';
import EditPageMods from './mods/editpagemods';
import EditPageAdvanced from './advanced/editpageadvanced';
import EditPageResourcePacks from './resourcepacks/editpageresourcepacks';
import ProfilesManager from '../../manager/profilesManager';
import EditPageWorlds from './worlds/editpageworlds';

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
export default function EditPage({ match }) {
  const { header } = useContext(NavContext);

  const { params } = match;
  const { page, id } = params;

  useEffect(() => {
    header.setTitle('EDIT INSTANCE');
    header.setShowChildren(false);
    header.setBackLink(`/profile/${id}`);
    header.setShowBackButton(true);
  }, []);

  return (
    <BG>
      <Sidebar isDefaultProfile={ProfilesManager.getProfileFromID(id).isDefaultProfile} id={id} />
      <CC>
        {page === 'general' && <EditPageGeneral id={id} />}
        {page === 'versions' && <EditPageVersions id={id} />}
        {page === 'mods' && <EditPageMods id={id} />}
        {page === 'resourcepacks' && <EditPageResourcePacks id={id} />}
        {page === 'worlds' && <EditPageWorlds id={id} />}
        {page === 'advanced' && <EditPageAdvanced id={id} />}
      </CC>
    </BG>
  );
}

EditPage.propTypes = {
  match: PropTypes.object.isRequired
};
