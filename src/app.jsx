import React from 'react';

import { HashRouter as Router, Route } from 'react-router-dom';
import HomePage from './page/home/homePage';
import ViewProfilePage from './page/viewprofile/viewprofile';

const App = () => (
    <div>
        <Router>
            <div>
                <Route exact path='/' component={HomePage} />
                <Route path='/profile/:id' component={ViewProfilePage} />
            </div>
        </Router>
    </div>
);

export default App;