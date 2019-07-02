import React, { Component } from 'react';
import Curse from '../../host/curse/curse';
import styled from 'styled-components';
import Button from '../button/button';
import AssetCard from '../assetcard/assetcard';
import SanitizedHTML from '../sanitizedhtml/sanitizedhtml';

const LoadingText = styled.div`
    font-size: 23pt;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: white;
`

const Description = styled.div`
    overflow: scroll;
    background-color: #717171;
    margin-top: 10px;
    margin-bottom: 10px;
`

const HeaderButtons = styled.div`
    margin-top: 5px;
`

const HB = styled(Button)`
    background-color: #717171;
    ${props => props.active && `
        border-bottom: 2px solid #08b20b;
    `}
    ${props => !props.active && `
        border-bottom: 2px solid #717171;
    `}
    margin-right: 3px;
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
    }

    updateProgressStates = () => {
        this.renderAssets(this.state.assets);
    }
    renderAssets = (assets) => {
        let newAssetsList = [];
        let { displayState } = this.state;
        let progressState = this.props.progressState;
        if(assets) {
            if(assets.length >= 1) {
                for(let asset of assets) {
                    newAssetsList.push(<AssetCard key={asset.id} installed={progressState[asset.id] === 'installed'} progressState={progressState[asset.id]} onClick={this.showAsset} installClick={this.props.installClick} showInstall={displayState === 'browseAssets'} showBlurb={displayState === 'browseAssets'} asset={asset} />);
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
            let mod = Curse.cached.assets[e.currentTarget.dataset.cachedid];
            console.log(mod);
            this.props.stateChange('viewAsset');
            this.setState({
                previousState: 'browseAssets',
                displayState: 'viewAsset',
                previewState: 'description',
                activeAsset: mod
            }, () => {
                this.showDescription();
            });
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
        let { displayState, previewState, description, activeAsset, assetsList } = this.state;
        let { type, progressState, installClick } = this.props;
        return (
            <>
                {displayState === 'browseAssets' && <>
                    {assetsList.length !== 0 && 
                        <List>
                            {assetsList}
                        </List>
                    }
                    {assetsList.length === 0 && <LoadingText>loading...</LoadingText>}
                </>}
                {displayState === 'viewAsset' && <>
                    <AssetCard progressState={progressState[activeAsset.id]} installed={progressState[activeAsset.id] === 'installed'} disableHover showInstall installClick={installClick} asset={activeAsset} showBlurb />
                    <HeaderButtons>
                        <HB active={previewState === 'description'} onClick={this.previewStateSwitch} data-state='description'>Description</HB>
                        {type === 'mod' && <HB active={previewState === 'dependencies'} onClick={this.previewStateSwitch} data-state='dependencies'>Dependencies</HB>}
                    </HeaderButtons>

                        {previewState === 'description' && <>
                            {description && <Description>
                                <SanitizedHTML html={activeAsset.description} />
                            </Description>}
                            {!description && <LoadingText>loading...</LoadingText>}
                            </>
                        }


                        {previewState === 'versions' &&
                            <h1>versions</h1>
                        }

                        {previewState === 'dependencies' &&
                            <List>
                                {this.state.assetDependencies}
                            </List>
                        }
                    </>}
                </>
        )
    }
}

DiscoverList.defaultProps = {
    progressState: {}
}