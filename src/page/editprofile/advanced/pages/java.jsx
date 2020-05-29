import React from 'react';
import PropTypes from 'prop-types';
import Java from '../../../settings/pages/java';
import OverrideMessage from '../../components/overrideMessage';

export default function ProfileSettingsJava({ profile }) {
  return (
    <>
      <OverrideMessage />
      <Java profileScope={profile} />
    </>
  );
}

ProfileSettingsJava.propTypes = {
  profile: PropTypes.object
};
