import React, { Component } from 'react';
import Curse from '../../host/curse/curse';
import styled from 'styled-components';
import AssetCard from '../assetcard/assetcard';
import AssetInfo from '../assetinfo/assetinfo';

const LoadingText = styled.div`
    font-size: 23pt;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: white;
`

const List = styled.div`
    flex: 1 1 auto;
    overflow-y: scroll;
    margin-top: 10px;
    margin-bottom: 20px;
`

export default class DiscoverList extends Component {
    constructor(props) {
        super(props);
        this.listRef = React.createRef();
        this.state = {
            displayState: '',
            assetsList: []
        }
    }

    browseAssets = async () => {
        this.setState({
            displayState: 'browseAssets'
        })

        this.renderAssets(await Curse.getPopularAssets(this.props.type));
    }

    static getDerivedStateFromProps(props) {
        return {
            displayState: props.state
        }
    }

    componentDidMount() {
        this.browseAssets();
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
        this.renderAssets(this.state.assets);
    }
    renderAssets = (assets) => {
        let newAssetsList = [];
        let progressState = this.props.progressState;
        if(assets) {
            if(assets.length >= 1) {
                for(let asset of assets) {
                    newAssetsList.push(<AssetCard key={asset.id} installed={progressState[asset.id] === 'installed'} progressState={progressState[asset.id]} onClick={this.showAsset} installClick={this.props.installClick} showInstall showBlurb asset={asset} />);
                }
            }else{
                newAssetsList.push(<LoadingText key='none'>No Results</LoadingText>);
            }
        }

        this.setState({
            assetsList: newAssetsList,
            assets: assets
        });
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
        console.log('back has been clicked!');
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
        console.log(res);
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

    renderSearch = () => {
        let { displayState } = this.state;
        let term = this.props.searchTerm;
        this.setState({
            assetsList: []
        });
        if(displayState === 'browseAssets') {
            if(term.trim() !== '') { 
                Curse.search(term, this.props.type).then((res) => {
                    this.renderAssets(res);
                });
            }else{
                this.browseAssets();
            }
        }
    }

    render() {
        let { displayState, assetsList, activeAsset } = this.state;
        let { type, progressState, installClick, versionInstall, mcVerFilter, forceVersionFilter, versionState } = this.props;
        return (
            <>
                {displayState === 'browseAssets' && <>
                    {assetsList.length !== 0 && 
                        <List ref={this.listRef}>
                            {assetsList}
                        </List>
                    }
                    {assetsList.length === 0 && <LoadingText>loading...</LoadingText>}
                </>}
                {displayState === 'viewAsset' && <AssetInfo versionInstall={versionInstall} versionState={versionState} forceVersionFilter={forceVersionFilter} mcVerFilter={mcVerFilter} progressState={progressState[activeAsset.id]} asset={activeAsset} installClick={installClick} type={type} />}
            </>
        )
    }
}

DiscoverList.defaultProps = {
    progressState: {}
}