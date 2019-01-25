import React from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import SearchBox from '../../component/searchbox/searchbox';
import Button from '../../component/button/button';
const HomePage = () => (
    <Page>
        <Header title='profiles' backlink='/'>
            <SearchBox placeholder='search' />
            <Button color='purple'>import</Button>
            <Button color='green'>create</Button>
        </Header>
    </Page>
)

export default HomePage;