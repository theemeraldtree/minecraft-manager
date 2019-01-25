import React from 'react';

import { HashRouter as Router, Route } from 'react-router-dom';
import HomePage from './page/home/homePage';

const App = () => (
    <div>
        <Router>
            <Route exact path='/' component={HomePage} />
        </Router>
    </div>
);

export default App;