import React, { Component } from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import SearchBox from '../../component/searchbox/searchbox';
import DiscoverList from '../../component/discoverlist/discoverlist';

export default class DiscoverPage extends Component {
    constructor() {
        super();
        this.state = {
            searchTerm: '',
            searchValue: '',
            listState: 'browseAssets'
        }
    }

    searchChange = (e) => {
        let term = e.target.value;
        this.setState({
            searchValue: term
        });
        if(e.key === 'Enter') {
            this.setState({
                searchTerm: term
            })
        }
    }
    
    listStateChange = (newState) => {
        this.setState({
            listState: newState
        });
    }

    backClick = () => {
        if(this.state.listState === 'viewAsset') {
            this.setState({
                listState: 'browseAssets'
            })
        }
    }

    render() {
        let { listState } = this.state;
        return (
            <Page>
                <Header showBackButton={listState !== 'browseAssets'} backClick={this.backClick} title='discover'>
                    {listState === 'browseAssets' && <SearchBox value={this.state.searchValue} onChange={this.searchChange} onKeyPress={this.searchChange} placeholder='search' />}
                </Header>
                <DiscoverList stateChange={this.listStateChange} state={listState} type='modpacks' searchTerm={this.state.searchTerm} />
            </Page>
        )
    }

}