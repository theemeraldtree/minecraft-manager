import React from 'react';

import { HashRouter as Router, Route } from 'react-router-dom';
import HomePage from './page/home/homePage';

const App = () => (
    <div>
        <Router>
            <div>
                <Route exact path='/' component={HomePage} />
            </div>
        </Router>
    </div>
);

export default App;