import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@theemeraldtree/emeraldui';
import ProfilesManager from '../../manager/profilesManager';
import SanitizedHTML from '../../component/sanitizedhtml/sanitizedhtml';
import Confirmation from '../../component/confirmation/confirmation';
import ShareOverlay from '../../component/shareoverlay/shareoverlay';
import UpdateOverlay from '../../component/updateoverlay/updateoverlay';
import NavContext from '../../navContext';
import Global from '../../util/global';
import LaunchingOverlay from '../../component/launchingOverlay/launchingOverlay';

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
  && {
    width: 170px;
    text-align: center;
  }
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

  const [profile] = useState(ProfilesManager.getProfileFromID(match.params.id));
  const [showDelete, setShowDelete] = useState(false);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [showUpdateOverlay, setShowUpdateOverlay] = useState(false);
  const [showLaunching, setShowLaunching] = useState(false);

  useEffect(() => {
    header.setTitle('profile');
    header.setShowChildren(false);
    header.setBackLink('/');
    header.setShowBackButton(true);
  }, []);

  const editProfile = () => {
    history.push(`/edit/general/${profile.id}`);
  };

  const confirmDelete = () => {
    history.push('/');
    ProfilesManager.deleteProfile(profile);
  };

  if (profile) {
    return (
      <>
        {showDelete && (
          <Confirmation
            questionText="are you sure?"
            cancelDelete={() => setShowDelete(false)}
            confirmDelete={confirmDelete}
          />
        )}
        <LaunchingOverlay show={showLaunching} />
        <ProfileHeader>
          {profile.iconPath && <Image src={`file:///${profile.iconPath}#${Global.cacheUpdateTime}`} />}
          <PHSide>
            <Title>{profile.name}</Title>
            <Blurb>{profile.blurb}</Blurb>
          </PHSide>
        </ProfileHeader>
        <MiddlePanel>
          <ButtonGroup>
            <CustomButton
              onClick={async () => {
                setShowLaunching(true);
                await profile.launch();
                setShowLaunching(false);
              }}
              color="green"
            >
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
        <ShareOverlay show={showShareOverlay} cancelClick={() => setShowShareOverlay(false)} profile={profile} />
        <UpdateOverlay show={showUpdateOverlay} cancelClick={() => setShowUpdateOverlay(false)} profile={profile} />
      </>
    );
  }
  return <Redirect to="/" />;
}

ViewProfilePage.propTypes = {
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired
};

export default withRouter(ViewProfilePage);
