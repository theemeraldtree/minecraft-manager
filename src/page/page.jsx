import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ImportOverlay from '../component/importoverlay/importoverlay';
import ProfilesManager from '../manager/profilesManager';

const app = require('electron').remote;

export default class Page extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      hideOverlay: false
    };
  }

  importCancel = () => {
    localStorage.setItem('importDone', 'true');
    ProfilesManager.getProfiles().then(() => {
      this.setState({
        hideOverlay: true
      });
    });
  };

  render() {
    const { children } = this.props;
    const { hideOverlay } = this.state;
    return (
      <>
        {app.process.argv[1] !== '.' &&
          app.process.argv[1] !== '--updated' &&
          app.process.argv[1] &&
          !hideOverlay &&
          localStorage.getItem('importDone') !== 'true' && (
            <ImportOverlay file={app.process.argv[1]} cancelClick={this.importCancel} />
          )}
        {children}
      </>
    );
  }
}

Page.propTypes = {
  children: PropTypes.node.isRequired
};
