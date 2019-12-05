import React, { PureComponent } from 'react';
import Page from '../page';
import Header from '../../component/header/header';
import SearchBox from '../../component/searchbox/searchbox';
import DiscoverList from '../../component/discoverlist/discoverlist';
import Curse from '../../host/curse/curse';
import ProfilesManager from '../../manager/profilesManager';

export default class DiscoverPage extends PureComponent {
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
        ProfilesManager.registerReloadListener(this.updateProgressStates);
        this.updateProgressStates();
    }

    componentWillUnmount() {
        ProfilesManager.unregisterReloadListener(this.updateProgressStates);
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
        this.setState({
            progressState: ProfilesManager.progressState
        });
        this.forceUpdate();
    }

    installClick = async (e) => {
        e.stopPropagation();
        let cachedID = e.currentTarget.parentElement.parentElement.dataset.cachedid;
        let modpack = Curse.cached.assets[cachedID];
        ProfilesManager.progressState[modpack.id] = {
            progress: 'installing',
            version: `temp-${new Date().getTime()}`
        }
        this.updateProgressStates();
        await Curse.installModpack(modpack);
        ProfilesManager.getProfiles().then(() => {
            this.updateProgressStates();
        });
    }
    
    versionInstall = async (version, mp) => {
        ProfilesManager.progressState[mp.id] = {
            progress: 'installing',
            version: version.displayName
        }
        this.updateProgressStates();
        await Curse.installModpackVersion(mp, version.hosts.curse.fileID);
        ProfilesManager.getProfiles().then(() => {
           this.updateProgressStates();
        })
    }

    render() {
        let { listState, progressState } = this.state;
        return (
            <Page>
                <Header showBackButton={listState !== 'browseAssets'} backClick={this.backClick} title='discover'>
                    {listState === 'browseAssets' && <SearchBox 
                                                        value={this.state.searchValue} 
                                                        onChange={this.searchChange} 
                                                        onKeyPress={this.searchChange} 
                                                        placeholder='search' 
                                                    />
                    }
                </Header>

                <DiscoverList 
                    host='curse' 
                    mcVerFilter='All' 
                    versionInstall={this.versionInstall} 
                    progressState={progressState} 
                    stateChange={this.listStateChange} 
                    state={listState} 
                    type='profile' 
                    installClick={this.installClick} 
                    searchTerm={this.state.searchTerm} 
                />
            </Page>
        )
    }

}