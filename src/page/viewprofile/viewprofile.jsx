import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import styled from 'styled-components';
import Page from '../page';
import ProfilesManager from '../../manager/profilesManager';
import Button from '../../component/button/button';
import SanitizedHTML from '../../component/sanitizedhtml/sanitizedhtml';
import Confirmation from '../../component/confirmation/confirmation';
import ShareOverlay from '../../component/shareoverlay/shareoverlay';
import UpdateOverlay from '../../component/updateoverlay/updateoverlay';
import NavContext from '../../navContext';
import Global from '../../util/global';

const Image = styled.img`
  min-width: 193px;
  height: 193px;
`;

const Title = styled.p`
  font-size: 26pt;
  color: white;
  font-weight: 900;
  display: inline-block;
  margin: 0;
`;

const Blurb = styled.p`
  font-size: 18pt;
  color: #dddbdd;
  margin: 0;
`;

const ProfileHeader = styled.div`
  margin: 10px;
  display: flex;
  align-items: center;
  min-height: 193px;
`;

const PHSide = styled.div`
  margin-left: 20px;
  display: inline-block;
  position: relative;
`;

const MiddlePanel = styled.div`
  display: flex;
  align-items: flex-start;
  flex: 0 1 auto;
  min-height: 230px;
  padding: 10px;
  height: 100%;
`;

const CustomButton = styled(Button)`
  width: 170px;
  text-align: center;
`;

const ButtonGroup = styled.div`
  width: 200px;
  button:not(:first-child) {
    margin-top: 5px;
  }
`;

const Description = styled.div`
  overflow-y: auto;
  background-color: #404040;
  margin: 0 10px;
  flex: 1 1 auto;
  height: 100%;
`;

function ViewProfilePage({ match, history }) {
  const { header } = useContext(NavContext);

  const [profile, setProfile] = useState({ name: 'loading...' });
  const [showDelete, setShowDelete] = useState(false);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [showUpdateOverlay, setShowUpdateOverlay] = useState(false);

  useEffect(() => {
    const prof = ProfilesManager.getProfileFromID(match.params.id);
    if (prof) {
      setProfile(prof);
    }

    header.setTitle('profile');
    header.setShowChildren(false);
    header.setBackLink('/');
    header.setShowBackButton(true);
  }, []);

  const editProfile = () => {
    history.push(`/edit/general/${profile.id}`);
  };

  const confirmDelete = () => {
    ProfilesManager.deleteProfile(profile).then(() => {
      history.push('/');
    });
  };

  if (profile) {
    return (
      <Page>
        {showDelete && (
          <Confirmation
            questionText="are you sure?"
            cancelDelete={() => setShowDelete(false)}
            confirmDelete={confirmDelete}
          />
        )}
        <ProfileHeader>
          {profile.iconPath && <Image src={`file:///${profile.iconPath}#${Global.cacheUpdateTime}`} />}
          <PHSide>
            <Title>{profile.name}</Title>
            <Blurb>{profile.blurb}</Blurb>
          </PHSide>
        </ProfileHeader>

        <MiddlePanel>
          <ButtonGroup>
            <CustomButton onClick={() => profile.launch()} color="green">
              launch
            </CustomButton>
            <CustomButton onClick={editProfile} color="yellow">
              edit
            </CustomButton>
            {!profile.isDefaultProfile && (
              <>
                <CustomButton onClick={() => setShowUpdateOverlay(true)} color="purple">
                  update
                </CustomButton>
                <CustomButton onClick={() => setShowShareOverlay(true)} color="blue">
                  share
                </CustomButton>
                <CustomButton onClick={() => setShowDelete(true)} color="red">
                  delete
                </CustomButton>
              </>
            )}
          </ButtonGroup>
          <Description>
            <SanitizedHTML html={profile.description} />
          </Description>
        </MiddlePanel>
        {showShareOverlay && <ShareOverlay cancelClick={() => setShowShareOverlay(false)} profile={profile} />}
        {showUpdateOverlay && <UpdateOverlay cancelClick={() => setShowUpdateOverlay(false)} profile={profile} />}
      </Page>
    );
  }
  return <Redirect to="/" />;
}

ViewProfilePage.propTypes = {
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired
};

export default withRouter(ViewProfilePage);
