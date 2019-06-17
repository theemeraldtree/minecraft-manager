import React, { Component } from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import SearchBox from '../../component/searchbox/searchbox';
import DiscoverList from '../../component/discoverlist/discoverlist';
import Curse from '../../host/curse/curse';
import ProfilesManager from '../../manager/profilesManager';

export default class DiscoverPage extends Component {
    constructor() {
        super();
        this.state = {
            searchTerm: '',
            searchValue: '',
            listState: 'browseAssets',
            progressState: {}
        }
    }

    componentDidMount() {
        this.updateProgressStates();
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

    updateProgressStates = () => {
        let ps = {};
        for(let profile of ProfilesManager.loadedProfiles) {
            if(profile.hosts) {
                if(profile.hosts.curse) {
                    ps[profile.id] = 'installed';
                }
            }
        }

        this.setState({
            progressState: ps
        })
    }

    installClick = (e) => {
        e.stopPropagation();
        let cachedID = e.currentTarget.parentElement.parentElement.dataset.cachedid;
        let modpack = Curse.cachedItems[cachedID];
        let id = modpack.id;
        let ps = Object.assign({}, this.state.progressState);
        ps[id] = 'installing';
        this.setState({
            progressState: ps
        }, () => {
            Curse.installModpack(modpack).then(() => {
                ProfilesManager.getProfiles().then(() => {
                    this.updateProgressStates();
                });
            });
        })
    }

    render() {
        let { listState, progressState } = this.state;
        return (
            <Page>
                <Header showBackButton={listState !== 'browseAssets'} backClick={this.backClick} title='discover'>
                    {listState === 'browseAssets' && <SearchBox value={this.state.searchValue} onChange={this.searchChange} onKeyPress={this.searchChange} placeholder='search' />}
                </Header>
                <DiscoverList progressState={progressState} stateChange={this.listStateChange} state={listState} type='modpacks' installClick={this.installClick} searchTerm={this.state.searchTerm} />
            </Page>
        )
    }

}