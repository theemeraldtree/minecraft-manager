import React, { Component } from 'react';
import styled from 'styled-components';
import Button from '../button/button';
import AssetCard from '../assetcard/assetcard';
import SanitizedHTML from '../sanitizedhtml/sanitizedhtml';
import Curse from '../../host/curse/curse';
import VersionCard from '../versioncard/versioncard';
import Detail from '../detail/detail';
import Global from '../../util/global';
import CustomDropdown from '../customdropdown/customdropdown';
const LoadingText = styled.div`
    font-size: 23pt;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: white;
    flex-flow: column;
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
    overflow-x: hidden;
    margin-top: 10px;
    margin-bottom: 20px;
`

const Header = styled.h4`
    margin: 0;
    color: white;
`

const Container = styled.div`
    flex-shrink: 0;
`

const TryAgain = styled.p`
    margin: 0;
    color: lightblue;
    font-size: 14pt;
    cursor: pointer;
`

export default class AssetInfo extends Component {
    constructor(props) {
        super(props);
        this.versionsListRef = React.createRef();
        this.state = {
            activeAsset: {
                name: 'Loading'
            },
            displayState: 'description',
            description: false
        }
    }

    componentDidMount() {
        if(!this.state.mcVerFilter) {
            this.setState({
                mcVerFilter: this.props.mcVerFilter
            })
        }
        this.showDescription();
    }

    componentDidUpdate(prevProps) {
        if(prevProps.versionState !== this.props.versionState && this.state.displayState === 'versions') {
            this.showVersions();
        }
    }

    showDescription = async () => {
        const newAsset = await Curse.addDescription(this.state.activeAsset);
        if(newAsset.description) {
            this.setState({
                activeAsset: newAsset,
                description: true
            })
        }else{
            this.setState({
                description: false,
                cantConnect: true
            })
        }
    }

    showDependencies = async () => {
        const newAsset = Object.assign({}, this.state.activeAsset);
        this.setState({
            assetDependencies: [<LoadingText key='loading'>loading...</LoadingText>]
        });
        const res = await Curse.getDependencies(this.state.activeAsset);
        console.log(res);
        if(res) {
            console.log(res);
            newAsset.dependencies = res;
    
            let newDependList = [];
            if(res.length >= 1) {
                for(let asset of res) {
                    console.log(asset);
                    newDependList.push(<AssetCard disableHover key={asset.id} showBlurb={true} asset={asset} />);
                }
            }else{
                newDependList.push(<LoadingText key='none2'>No Dependencies</LoadingText>);
            }
    
            this.setState({
                activeAsset: newAsset,
                assetDependencies: newDependList,
            });
        }else{
            this.setState({
                cantConnect: true,
                assetDependencies: []
            })
        }
        
    }

    showVersions = async () =>{
        const { activeAsset, mcVerFilter } = this.state;
        const { localAsset } = this.props;
        if(activeAsset.hosts.curse) {
            this.setState({
                versions: [<LoadingText key ='loading1'>loading</LoadingText>]
            })
            const versions = await Curse.getVersionsFromAsset(activeAsset);
            if(versions) {
                let final = [];
                for(let version of versions) {
                    if(version.minecraftversions.includes(mcVerFilter) || mcVerFilter === 'All') {
    
                        let ps = this.props.versionState[version.displayName];
                        if(this.props.disableVersionInstall && ps !== 'installing') {
                            ps = 'disable-install';
                        }
                        const forceVerFilter = this.props.forceVersionFilter && (mcVerFilter !== this.props.mcVerFilter);
                        if(localAsset) {
                            final.push(<VersionCard key={version.displayName} progressState={ps} installClick={this.versionInstall} asset={activeAsset} installed={activeAsset.version.hosts.curse.fileID === version.hosts.curse.fileID} disableMcVer={forceVerFilter} version={version} />);
                        }else{
                            final.push(<VersionCard key={version.displayName} progressState={ps} installClick={this.versionInstall} asset={activeAsset} disableMCVer={forceVerFilter} version={version} />);
                        }
                    }
                }
    
                console.log(this.state.scrollPosition);
    
                if(final.length === 0) {
                    final.push(<LoadingText key='none1'>no versions found</LoadingText>)
                }
                this.setState({
                    versions: final
                }, () => {
                    this.versionsListRef.current.scrollTop = this.state.scrollPosition
                })
            }else{
                this.setState({
                    cantConnect: true
                })
            }
            
        }else{
            this.setState({
                versions: [<LoadingText key='none2'>no versions found, as this is a local file</LoadingText>]
            })
        }
    }

    versionInstall = (e) => {
        const version = Global.cached.versions[e.currentTarget.dataset.version];
        console.log(Global.cached.versions);
        console.log(version);
        this.setState({
            scrollPosition: this.versionsListRef.current.scrollTop
        })
        this.props.versionInstall(version, this.state.activeAsset);
    }

    displayStateSwitch = (e) => {
        let newState = e.currentTarget.dataset.state;

        this.setState({
            displayState: newState,
            cantConnect: false
        })

        if(newState === 'description') {
            this.showDescription();
        }else if(newState === 'dependencies') {
            this.showDependencies();
        }else if(newState === 'versions') {
            console.log(this.props.asset.minecraftversion);
            this.showVersions();
        }
    }

    static getDerivedStateFromProps(props) {
        return {
            activeAsset: props.asset
        }
    }

    mcVerChange = (ver) => {
        this.setState({
            mcVerFilter: ver
        }, () => {
            this.showVersions();
        })

    }

    tryAgain = () => {
        this.displayStateSwitch({
            currentTarget: {
                dataset: {
                    state: this.state.displayState
                }
            }
        });
    }

    render() {
        const { displayState, description, versions, activeAsset, assetDependencies, cantConnect } = this.state;
        const { type, installClick, localAsset, progressState } = this.props;
        return (
            <>
                <AssetCard progressState={progressState} installed={displayState[activeAsset.id] === 'installed'} disableHover showInstall={!localAsset} installClick={installClick} asset={activeAsset} showBlurb />
                <HeaderButtons>
                    <HB active={displayState === 'description'} onClick={this.displayStateSwitch} data-state='description'>Description</HB>
                    {<HB active={displayState === 'versions'} onClick={this.displayStateSwitch} data-state='versions'>Versions</HB>}
                    {type === 'mod' && <HB active={displayState === 'dependencies'} onClick={this.displayStateSwitch} data-state='dependencies'>Dependencies</HB>}
                </HeaderButtons>
                    {displayState === 'description' && <>
                        {description && <Description>
                            <SanitizedHTML html={activeAsset.description} />
                        </Description>}
                        {!description && !cantConnect && <LoadingText>loading...</LoadingText>}
                        </>
                    }


                    {cantConnect && <LoadingText>
                        can't connect
                        <TryAgain onClick={this.tryAgain}>try again</TryAgain>
                    </LoadingText>}
                    {displayState === 'versions' && <>
                        {localAsset && ! cantConnect && <Container>
                            <Header>current version</Header>
                            <VersionCard installed asset={activeAsset} version={activeAsset.version} />
                        </Container>}

                        {!cantConnect && <>
                            <Header>all versions</Header>
                            <Detail>minecraft version</Detail>
                            <CustomDropdown value={this.state.mcVerFilter} items={Global.getMCFilterOptions()} onChange={this.mcVerChange} />
                            {activeAsset.hosts.curse && <>
                                <List ref={this.versionsListRef}>
                                    {versions}
                                </List>
                            </>}
                        </>}
                    </>}

                    {displayState === 'dependencies' &&
                        <List>
                            {assetDependencies}
                        </List>
                    }
            </>
        )
    }
}