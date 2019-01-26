const remote = require('electron').remote;
const app = remote.app;
const path = require('path');
const Global = {
    MCM_PATH: app.getPath('userData'),
    PROFILES_PATH: path.join(app.getPath('userData') + '/profiles/')
}

export default Global;