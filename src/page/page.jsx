import React, { PureComponent } from 'react';
import ImportOverlay from '../component/importoverlay/importoverlay';
import ProfilesManager from '../manager/profilesManager';
const app = require('electron').remote;

export default class Page extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            hideOverlay: false
        }
    }
    importCancel = () => {
        localStorage.setItem('importDone', true);
        ProfilesManager.getProfiles().then(() => {
            this.setState({
                hideOverlay: true
            })
        })
    }


    render() {
        const { children } = this.props;
        return (
            <>
                {app.process.argv[1] !== '.' && app.process.argv[1] !== '--updated' && app.process.argv[1] && !this.state.hideOverlay && localStorage.getItem('importDone') === 'false' && <ImportOverlay file={app.process.argv[1]} cancelClick={this.importCancel} />}
                {children}
            </>
        )
    }
    
}