import React from 'react';

import { HashRouter as Router, Route, Redirect } from 'react-router-dom';
import HomePage from './page/home/homePage';
import SettingsPage from './page/settings/settingsPage';
import ViewProfilePage from './page/viewprofile/viewprofile';
import EditPageGeneral from './page/editprofile/general/editpagegeneral';
import EditPageVersions from './page/editprofile/versions/editpageversions';
import EditPageMods from './page/editprofile/mods/editpagemods';
import EditPageAdvanced from './page/editprofile/advanced/editpageadvanced';
import DiscoverPage from './page/discover/discover';
import SettingsManager from './manager/settingsManager';
import fs from 'fs';
import Global from './util/global';
import WelcomePage from './page/welcome/welcome';
import Toast from './component/toast/toast';
const App = () => (
    <div>            
        {localStorage.setItem('showDownloads', false)}
        {localStorage.setItem('importDone', false)}
        {SettingsManager.loadSettings()}
        <div>
            <Toast />
        </div>
        <Router>
            <div>
                {!fs.existsSync(Global.PROFILES_PATH) && <Redirect to='/welcome' />}
                <Route exact path='/' component={HomePage} />
                <Route path='/discover' component={DiscoverPage} />
                <Route path='/settings' component={SettingsPage} />
                <Route path='/welcome' component={WelcomePage} />
                <Route path='/profile/:id' component={ViewProfilePage} />
                <Route path='/edit/general/:id' component={EditPageGeneral} />
                <Route path='/edit/versions/:id' component={EditPageVersions} />
                <Route path='/edit/mods/:id' component={EditPageMods} />
                <Route path='/edit/advanced/:id' component={EditPageAdvanced} />
            </div>
        </Router>
    </div>
);

export default App;