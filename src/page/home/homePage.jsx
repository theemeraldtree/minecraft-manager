import React from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import SearchBox from '../../component/searchbox/searchbox';
import Button from '../../component/button/button';
import ProfileGrid from './components/profilegrid';

const HomePage = () => (
    <Page>
        <Header title='profiles'>
            <SearchBox placeholder='search' />
            <Button color='purple'>import</Button>
            <Button color='green'>create</Button>
        </Header>
        <ProfileGrid />
    </Page>
)

export default HomePage;