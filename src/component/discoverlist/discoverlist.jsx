import React, { Component } from 'react';
import Curse from '../../host/curse/curse';
import styled from 'styled-components';
import AssetCard from '../assetcard/assetcard';
import AssetInfo from '../assetinfo/assetinfo';
import Hosts from '../../host/Hosts';

const LoadingText = styled.div`
    font-size: 23pt;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: white;
    flex-flow: row;
    flex-flow: column;
`

const List = styled.div`
    flex: 1 1 auto;
    overflow-y: scroll;
    margin-top: 10px;
    margin-bottom: 20px;
`

const TryAgain = styled.p`
    margin: 0;
    color: lightblue;
    font-size: 14pt;
    cursor: pointer;
`;

const Persists = styled.p`
    font-size: 14pt;
    text-align: center;
    color: white;
`;
export default class DiscoverList extends Component {
    constructor(props) {
        super(props);
        this.listRef = React.createRef();
        this.state = {
            displayState: '',
            assets: [],
            loading: true,
            cantConnect: false,
            isSearching: false
        }
    }

    browseAssets = async () => {
        const { host, type } = this.props;
        this.setState({
            displayState: 'browseAssets',
            isSearching: false,
            cantConnect: false
        })

        const assets = await Hosts.getTopAssets(host, type);
        if(assets) {
            this.setState({
                assets: assets,
                loading: false
            })
        }else{
            this.setState({
                cantConnect: true
            })
        }
    }

    static getDerivedStateFromProps(props) {
        return {
            displayState: props.state,
            progressState: props.progressState
        }
    }

    componentDidMount() {
        this.browseAssets();
    }

    shouldComponentUpdate() {
        return true;
    }

    componentDidUpdate(prevProps) {
        if(prevProps.searchTerm !== this.props.searchTerm) {
            this.renderSearch();
        }
        if(prevProps.progressState !== this.props.progressState) {
            this.updateProgressStates();
        }
        if(prevProps.state !== this.props.state) {
            this.stateChange();
        }
    }

    updateProgressStates = () => {
        this.setState({
            psUpdatePending: true
        })
    }

    showAsset = (e) => {
        let { displayState } = this.state;
        if(displayState === 'browseAssets') {
            let scrollPos = undefined;
            if(this.listRef) {
                scrollPos = this.listRef.current.scrollTop;
            }
            let mod = Curse.cached.assets[e.currentTarget.dataset.cachedid];
            this.props.stateChange('viewAsset');
            this.setState({
                previousState: 'browseAssets',
                displayState: 'viewAsset',
                previewState: 'description',
                activeAsset: mod, 
                scrollPos: scrollPos
            });
        }
    }
    
    stateChange = () => {
        const { state } = this.props;
        if(state === 'browseAssets') {       
            if(this.state.scrollPos) {
                this.listRef.current.scrollTop = this.state.scrollPos
            }   
        }

    }

    goBack = () => {
        let { displayState, previousState } = this.state;
        let newState;
        switch(displayState) {
            case 'browseAssets':
                newState = 'assetsList';
                break;
            case 'viewAsset':
                newState = previousState;
                break;
            default:
                break;
        }

        this.setState({
            displayState: newState
        })
    }

    showDescription = async () => {
        const newAsset = await Curse.addDescription(this.state.activeAsset);
        this.setState({
            activeAsset: newAsset,
            description: true
        })
    }

    showDependencies = async () => {
        let newAsset = Object.assign({}, this.state.activeAsset);
        this.setState({
            assetDependencies: [<LoadingText key='loading'>loading...</LoadingText>]
        });
        const res = await Curse.getDependencies(this.state.activeAsset);
        newAsset.dependencies = res;

        let newDependList = [];
        if(res.length >= 1) {
            for(let asset of res) {
                newDependList.push(<AssetCard showInstall={true} disableHover key={asset.id} showBlurb={true} asset={asset} />);
            }
        }else{
            newDependList.push(<LoadingText key='none2'>No Dependencies</LoadingText>);
        }

        this.setState({
            activeAsset: newAsset,
            assetDependencies: newDependList,
        });
    }

    previewStateSwitch = (e) => {
        let newState = e.currentTarget.dataset.state;

        this.setState({
            previewState: newState
        });
        if(newState === 'description') {
            this.showDescription();
        }else if(newState === 'dependencies') {
            this.showDependencies();
        }
    }

    tryAgain = () => {
        let { displayState, isSearching } = this.state;
        if(displayState === 'browseAssets' && !isSearching) {
            this.browseAssets();
        }else if(isSearching) {
            this.renderSearch();
        }
    }

    renderSearch = async () => {
        let { displayState } = this.state;
        let { searchTerm, type, host } = this.props;
        this.setState({
            assets: [],
            loading: true,
            isSearching: true,
            cantConnect: false
        });
        if(displayState === 'browseAssets') {
            if(searchTerm.trim() !== '') { 
                const res = await Hosts.searchAssets(host, type, searchTerm);
                console.log(res); 
                this.setState({
                    assets: res,
                    loading: false
                });
            }else{
                this.browseAssets();
            }
        }
    }

    render() {
        let { displayState, assets, loading, activeAsset, progressState, cantConnect } = this.state;
        let { type, installClick, versionInstall, allowVersionReinstallation, mcVerFilter, forceVersionFilter, specificMCVer } = this.props;
        return (
            <>
                {displayState === 'browseAssets' && <>
                    <List ref={this.listRef}>
                        {
                            assets && assets.length >= 1 && !loading && assets.map(asset => {
                                    if(!progressState[asset.id]) {
                                        progressState[asset.id] = {};
                                    }
                                    return <AssetCard key={asset.id} progressState={progressState[asset.id]} onClick={this.showAsset} installClick={this.props.installClick} showInstall showBlurb asset={asset} />;
                            })
                        }
                        {
                            assets && assets.length === 0 && !loading && <LoadingText key='none'>No Results</LoadingText>
                        }
                    </List>
                    {loading && !cantConnect && <LoadingText>loading...</LoadingText>}
                    {cantConnect &&
                        <LoadingText>
                            can't connect
                            <TryAgain onClick={this.tryAgain}>try again</TryAgain>
                        </LoadingText>
                    }

                    {!assets && <>
                        <LoadingText>
                            something's strange<br />
                            we can't find anything<br />
                            <TryAgain onClick={this.tryAgain}>try again</TryAgain> 
                            <Persists>problem persists? <a href="https://theemeraldtree.net/mcm/issues">report it here</a></Persists>
                        </LoadingText>
                    </>}
                </>}
                {displayState === 'viewAsset' && <AssetInfo allowVersionReinstallation={allowVersionReinstallation} specificMCVer={specificMCVer} versionInstall={versionInstall} progressState={progressState[activeAsset.id]} localAsset={false} forceVersionFilter={forceVersionFilter} mcVerFilter={mcVerFilter} asset={activeAsset} installClick={installClick} type={type} />}
            </>
        )
    }
}

DiscoverList.defaultProps = {
    progressState: {}
}