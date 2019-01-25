import React from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import SearchBox from '../../component/searchbox/searchbox';
import Button from '../../component/button/button';
import ProfileCard from '../../component/profilecard/profilecard';
import styled from 'styled-components';

const CardGrid = styled.div`
    overflow-y: scroll;
    flex: 1 1 auto;
    padding-bottom: 10px;
`;

const HomePage = () => (
    <Page>
        <Header title='profiles'>
            <SearchBox placeholder='search' />
            <Button color='purple'>import</Button>
            <Button color='green'>create</Button>
        </Header>
        <CardGrid>
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
        </CardGrid>
    </Page>
)

export default HomePage;