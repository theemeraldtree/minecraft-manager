import React, { Component } from 'react';
import { HashRouter as HashRouter, Route, Redirect } from 'react-router-dom';
import ProfilesPage from './page/profiles/profilesPage';
import ViewProfilePage from './page/viewprofile/viewProfilePage';
import FileUtils from './util/fileUtils';
import PageTransition from 'react-router-page-transition';
import CreateProfilePage from './page/createprofile/createProfilePage';
import EditSettingsPage from './page/editpages/editSettingsPage';
import EditModsPage from './page/editpages/editModsPage';
import AddModsPage from './page/editpages/addModsPage';
import ViewModPage from './page/editpages/viewModPage';
import ViewCurseModpackPage from './page/discoverpages/viewCurseModpack';
import DiscoverPage from './page/discover/discoverPage';
import EditResourcePacksPage from './page/editpages/editResourcePacksPage';
import EditMapsPage from './page/editpages/editMapsPage';
import DiscoverCurseForgePage from './page/discoverpages/discoverCurseForge';
import WelcomePage from './page/welcome/welcomePage';
import EditVersionsPage from './page/editpages/editVersionsPage';
import UpdateManager from './manager/updateManager';
import SettingsPage from './page/settings/settingsPage';
import EditAdvancedPage from './page/editpages/editAdvancedPage';
import ImportProfilePage from './page/importprofile/importProfilePage';
import styled, { injectGlobal } from 'styled-components';
const app = require('electron').remote;
injectGlobal`
  @import url('https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700,800');
  * {
    font-family: 'Open Sans', 'Segoe UI', sans-serif;
  }
  html, body {
    width: 100vw;
    height: 100vh;
    padding: 0;
    margin: 0;
  }

  a, img, p, div {
      user-drag: none; 
      user-select: none;
      -moz-user-select: none;
      -webkit-user-drag: none;
      -webkit-user-select: none;
      -ms-user-select: none;
  }
  ::-webkit-scrollbar {
    width: 12px; 
  }
  
  ::-webkit-scrollbar-track {
      opacity: 0;
  }
  
  ::-webkit-scrollbar-thumb {
      border-radius: 10px;
      background-color: rgba(0, 0, 0, 0.5);
  }
`
const AppWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
`
const OpenedFiles = [];
class App extends Component {
  render() {
    let argv1 = app.process.argv[1];
    console.log(argv1);
    let needtoimport = false;
    if(argv1 && argv1 !== '--noDevServer' && argv1 !== '' && argv1 !== '.' && argv1 !== '--updated' && !OpenedFiles.includes(argv1)) {
      console.log('need to import');
      needtoimport = true;
    }
    return (
      <HashRouter>
        <PageTransition>
          <AppWrapper>
            {UpdateManager.checkForUpdates()}
            {!FileUtils.isSetup() && <Redirect to="/welcome" />}
            <Route exact strict path='/' render={() => <Redirect to='/profiles' />} />
            <Route exact path='/profiles' component={ProfilesPage} /> 
            <Route path='/welcome' component={WelcomePage} />
            <Route path='/settings' component={SettingsPage} />
            <Route path="/profiles/viewprofile/:id" component={ViewProfilePage} /> 
            <Route path="/profiles/edit/:id/settings" component={EditSettingsPage} /> 
            <Route path="/profiles/edit/:id/mods" component={EditModsPage} /> 
            <Route path='/profiles/edit/:id/versions' component={EditVersionsPage} />
            <Route path='/profiles/edit/:id/resourcepacks' component={EditResourcePacksPage} />
            <Route path='/profiles/edit/:id/maps' component={EditMapsPage} />
            <Route path='/profiles/edit/:id/advanced' component={EditAdvancedPage} />
            <Route path="/profiles/edit/:id/addmods/:searchTerm" component={AddModsPage} />
            <Route path='/profiles/import' component={ImportProfilePage} />
            <Route exact path='/discover' component={DiscoverPage} />
            <Route exact path='/discover/curseforge/:searchTerm' component={DiscoverCurseForgePage} />
            <Route path='/discover/curseforge/viewmodpack/:modpack/:searchTerm' component={ViewCurseModpackPage} />
            <Route exact path='/discover/curseforge/viewmodpack/:modpack/' component={ViewCurseModpackPage} />
            <Route path='/profiles/createprofile' component={CreateProfilePage} />
            <Route path='/profiles/viewmod/:mod/:profile/:searchTerm' component={ViewModPage} />
            <Route exact path='/profiles/viewmod/:mod/:profile/' component={ViewModPage} />
            {needtoimport && <Redirect to='/profiles/import' />}
          </AppWrapper>
        </PageTransition>

      </HashRouter>
    );
  }
}

export default App;
export {
  OpenedFiles
}