import React, { useState } from 'react';
import styled from 'styled-components';

import { HashRouter as Router, Route, Redirect } from 'react-router-dom';
import HomePage from './page/home/homePage';
import SettingsPage from './page/settings/settingsPage';
import ViewProfilePage from './page/viewprofile/viewprofile';
import DiscoverPage from './page/discover/discover';
import SettingsManager from './manager/settingsManager';
import fs from 'fs';
import Global from './util/global';
import WelcomePage from './page/welcome/welcome';
import Toast from './component/toast/toast';
import ErrorBoundary from './errorBoundary';
import Alert from './component/alert/alert';
import Header from './component/header/header';
import WindowBar from './component/windowbar/windowbar';
import Navbar from './component/navbar/navbar';
import NavContext from './navContext';
import EditPage from './page/editprofile/edit';

const Container = styled.div`
    background-color: #212121;
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-flow: column;
`

const Content = styled.div`
    flex: 1 1 auto;
    display: flex;
    position: relative;
    height: 100%;
    overflow: hidden;
`


const ContentSide = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-flow: column;
    overflow-x: hidden;
`

let headerBackClickFunc = undefined;

function App() {
    const [, forceUpdate ] = useState();
    const [ headerTitle, setHeaderTitle ] = useState('loading...');
    const [ headerChildren, setHeaderChildren ] = useState('');
    const [ headerShowChildren, setHeaderShowChildren ] = useState(false);
    const [ headerBackLink, setHeaderBackLink ] = useState('');
    const [ headerShowBackButton, setHeaderShowBackButton ] = useState(false);

    return (
        <NavContext.Provider value={{
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
                }
            }
        }}>            
            {localStorage.setItem('showDownloads', false)}
            {localStorage.setItem('importDone', false)}
            {SettingsManager.loadSettings()}
            <div>
                <Alert />
                <Toast />
            </div>
            <Router>
                <ErrorBoundary>
                    <Container>
                        <WindowBar />
                        <Content>
                            {fs.existsSync(Global.PROFILES_PATH) && <Navbar />}
                            <ContentSide>
                                <Header />

                                <Route exact path='/' component={HomePage} />
                                <Route path='/discover' component={DiscoverPage} />
                                <Route path='/settings' component={SettingsPage} />
                                <Route path='/welcome' component={WelcomePage} />
                                <Route path='/profile/:id' component={ViewProfilePage} />
                                <Route path='/edit/:page/:id' component={EditPage} />
                            </ContentSide>
                        </Content>
                    </Container>

                    {!fs.existsSync(Global.PROFILES_PATH) && <Redirect to='/welcome' />}

                </ErrorBoundary>
            </Router>
        </NavContext.Provider>
    )
}

export default App;