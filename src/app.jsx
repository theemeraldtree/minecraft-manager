import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { HashRouter as Router, Route, Redirect } from 'react-router-dom';
import fs from 'fs';
import { DarkTheme, EmeraldUIThemeProvider, Spinner } from '@theemeraldtree/emeraldui';
import HomePage from './page/home/homePage';
import SettingsPage from './page/settings/settingsPage';
import ViewProfilePage from './page/viewprofile/viewprofile';
import DiscoverPage from './page/discover/discover';
import Global from './util/global';
import WelcomePage from './page/welcome/welcome';
import Toast from './component/toast/toast';
import ErrorBoundary from './errorBoundary';
import Alert from './component/alert/alert';
import Header from './component/header/header';
import Navbar from './component/navbar/navbar';
import NavContext from './navContext';
import EditPage from './page/editprofile/edit';
import Overlay from './component/overlay/overlay';
import AlertBackground from './component/alert/alertbackground';
import RREditHack from './page/rredithack/rredithack';

const Container = styled.div`
  background-color: #171717;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-flow: column;
  align-items: center;
  color: white;
`;

const Content = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #212121;
  display: flex;
  flex-flow: column;
`;


const MigratingCenter = styled.div`
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column;  
  margin-top: 50px;

  h3 {
    font-weight: 500;
  }

  .spinner {
    margin-top: 20px;
    margin-bottom: 20px;
  }
`;

let headerBackClickFunc;

function App() {
  const [, forceUpdate] = useState();
  const [headerTitle, setHeaderTitle] = useState('loading...');
  const [headerChildren, setHeaderChildren] = useState('');
  const [headerShowChildren, setHeaderShowChildren] = useState(false);
  const [headerBackLink, setHeaderBackLink] = useState('');
  const [headerShowBackButton, setHeaderShowBackButton] = useState(false);
  const [migrating, setMigrating] = useState({
    active: false
  });

  useEffect(() => {
    const migrate = (obj) => {
      setMigrating(obj);
    };

    Global.addMigratorListener(migrate);

    return () => {
      Global.removeMigratorListener(migrate);
    };
  }, []);

  return (
    <NavContext.Provider
      value={{
        header: {
          title: headerTitle,
          setTitle: setHeaderTitle,

          children: headerChildren,
          setChildren: setHeaderChildren,

          showChildren: headerShowChildren,
          setShowChildren: setHeaderShowChildren,

          backLink: headerBackLink,
          setBackLink: setHeaderBackLink,

          showBackButton: headerShowBackButton,
          setShowBackButton: setHeaderShowBackButton,

          onBackClick: headerBackClickFunc,
          setOnBackClick: func => {
            headerBackClickFunc = func;
            forceUpdate();
          },

          migrating,
          setMigrating,
        }
      }}
    >
      {localStorage.setItem('showDownloads', false)}
      <EmeraldUIThemeProvider theme={DarkTheme}>
        <div>
          <Alert />
          <Toast />
        </div>
        <Router>
          <ErrorBoundary>
            <Container>
              <Navbar />
              <Header />
              <Content>
                {migrating.active && (
                  <Overlay>
                    <AlertBackground>
                      <MigratingCenter>
                        <h1>updating...</h1>
                        <h3>Curently updatqing your  profiles to support Minecraft Manager version {Global.MCM_VERSION}</h3>
                        <h3>Do not close Minecraft Manager</h3>
                        <Spinner />
                        <h4>{migrating.step}</h4>
                      </MigratingCenter>
                    </AlertBackground>
                  </Overlay>
                )}

                <Route exact path="/" component={HomePage} />
                <Route path="/discover" component={DiscoverPage} />
                <Route path="/settings" component={SettingsPage} />
                <Route path="/welcome" component={WelcomePage} />
                <Route path="/profile/:id" component={ViewProfilePage} />
                <Route path="/edit/:page/:id" component={EditPage} />

                {/* TODO: Something better than RREditHack */}
                <Route path="/rr-edit-hack/:page/:id" component={RREditHack} />
              </Content>
            </Container>

            {!fs.existsSync(Global.PROFILES_PATH) && <Redirect to="/welcome" />}
          </ErrorBoundary>

        </Router>
      </EmeraldUIThemeProvider>

    </NavContext.Provider>
  );
}

export default App;
