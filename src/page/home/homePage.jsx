import React, { Component } from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import SearchBox from '../../component/searchbox/searchbox';
import Button from '../../component/button/button';
import ProfileGrid from './components/profilegrid';

export default class HomePage extends Component {
    constructor() {
        super();
        this.state = {
            searchTerm: ''
        }
    }

    searchChange = (e) => {
        this.setState({
            searchTerm: e.target.value.toLowerCase()
        })
    }
    
    render() {
        return (
            <Page>
                <Header title='profiles'>
                    <SearchBox onChange={this.searchChange} placeholder='search' />
                    <Button color='purple'>import</Button>
                    <Button color='green'>create</Button>
                </Header>
                <ProfileGrid searchTerm={this.state.searchTerm} />
            </Page>
        )
    }

}