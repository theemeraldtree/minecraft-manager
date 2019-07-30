import React, { Component } from 'react';
import styled from 'styled-components';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer';
import TextInput from '../../../component/textinput/textinput';
import Button from '../../../component/button/button';
import DiscoverList from '../../../component/discoverlist/discoverlist';
import InputContainer from '../components/inputcontainer';
import AssetCard from '../../../component/assetcard/assetcard';
import Curse from '../../../host/curse/curse';
import Confirmation from '../../../component/confirmation/confirmation';
import Mod from '../../../type/mod';
import path from 'path';
import fs from 'fs';
import Global from '../../../util/global';
import AssetInfo from '../../../component/assetinfo/assetinfo';
const { dialog } = require('electron').remote;
const Wrapper = styled.div`
    height: 100%;
    overflow: hidden;
`
const Container = styled.div`
    background-color: #505050;
    overflow: hidden;
    padding: 10px;
    display: flex;
    flex-flow: column;
    height: 100%;
`

const List = styled.div`
    flex: 1 1 auto;
    overflow-y: scroll;
    margin-top: 10px;
    margin-bottom: 20px;
`

const Search = styled(TextInput)`
    width: 100%;
    flex-shrink: 9999;
`

const SearchContainer = styled(InputContainer)`
    margin-top: 10px;
    flex-shrink: 0;
    background-color: #717171;
`


export default class EditPageMods extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modsList: [],
            searchTerm: '',
            liveSearchTerm: '',
            displayState: 'modsList',
            listState: 'browseAssets',
            progressState: {},
            versionState: {},
            profile: {
                name: 'Loading'
            },
        }
    }

    static getDerivedStateFromProps(props) {
        return {
            profile: ProfilesManager.getProfileFromID(props.match.params.id)
        }
    }

    componentDidMount() {
        this.reloadModsList();
    }

    reloadModsList() {
        let { profile, progressState } = this.state;
        let newList = [];
        let ps = {};
        for(let key of Object.keys(progressState)) {
            if(progressState[key] === 'notavailable') {
                ps[key] = 'notavailable';
            }else if(progressState[key] === 'installing') {
                ps[key] = 'installing';
            }
        }

        for(let mod of profile.mods) {
            ps[mod.id] = 'installed';
            if(this.state.displayState === 'modsList') {
                if(mod.name.toLowerCase().includes(this.state.liveSearchTerm.toLowerCase())) {
                    newList.push(<AssetCard disableHover={!mod.hosts.curse} key={mod.id} asset={mod} showDelete onClick={this.showInfoClick} deleteClick={this.deleteClick} />);
                }
            }else{
                newList.push(<AssetCard disableHover={!mod.hosts.curse} key={mod.id} asset={mod} showDelete onClick={this.showInfoClick} deleteClick={this.deleteClick} />);
            }
        }

        this.setState({
            modsList: newList,
            progressState: ps
        })
    }

    showInfoClick = (e) => {
        let mod = this.state.profile.getModFromID(e.currentTarget.dataset.assetid);
        console.log(mod);
        if(mod.hosts.curse) {
            this.setState({
                displayState: 'modInfo',
                activeMod: mod
            })
        }
    }

    goBack = () => {
        let { listState } = this.state;
        if(listState === 'browseAssets') {
            this.setState({
                displayState: 'modsList',
                liveSearchTerm: ''
            });
        }else{
           let newState;
           if(listState === 'viewAsset') {
               newState = 'browseAssets';
           }
           this.setState({
               listState: newState
           })
        }
    }

    browseMods = () => {
        this.reloadModsList();
        this.setState({
            displayState: 'addMods',
            liveSearchTerm: ''
        });
    }

    listStateChange = (state) => {
        this.setState({
            listState: state
        })
    }

    searchChange = (e) => {
        let term = e.target.value;
        if(this.state.displayState === 'modsList') {
            this.setState({
                liveSearchTerm: term
            }, () => {
                this.reloadModsList();
            });
        }
        if(e.key === 'Enter') {
            this.setState({
                searchTerm: term,
                listState: 'browseAssets'
            })
        }
    }

    installClick = (e) => {
        e.stopPropagation();
        let cachedID = e.currentTarget.parentElement.parentElement.dataset.cachedid;
        let mod = Curse.cached.assets[cachedID];
        let id = mod.id;
        let ps = Object.assign({}, this.state.progressState);
        ps[id] = 'installing';
        this.setState({
            progressState: ps
        }, async () => {
            try {
                await Curse.installModToProfile(this.state.profile, mod);
                this.reloadModsList();
            }catch(err) {
                if(err === 'no-version-available') {
                    let ps = Object.assign({}, this.state.progressState);
                    ps[id] = 'notavailable';
                    this.setState({
                        invalidVersion: true,
                        errorMod: mod,
                        progressState: ps
                    })
                }
            }
        });
    }

    deleteClick = (e) => {
        e.stopPropagation();
        let mod = this.state.profile.getModFromID(e.currentTarget.parentElement.parentElement.dataset.assetid);
        this.state.profile.deleteMod(mod).then(() => {
            this.reloadModsList();
        })
    }

    addFromFile = () => {
        let p = dialog.showOpenDialog({
            title: 'Choose your mod jar file',
            buttonLabel: 'Choose Mod',
            properties: ['openFile']
        });
        if(p[0]) {
            let { profile } = this.state;
            let pth = p[0];
            let filename = path.basename(pth);
            let mod = new Mod({
                name: filename,
                id: Global.createID(name),
                minecraftversion: profile.minecraftversion,
                jar: filename
            });
            fs.copyFileSync(pth, path.join(profile.modsPath, filename));
            profile.addMod(mod);
            this.reloadModsList();
        }
    }

    versionInstall = (version, mod) => {
        console.log(version);
        const { profile } = this.state;
        profile.deleteMod(mod).then(() => {
            const verCopy = Object.assign({}, this.state.versionState);
            verCopy[version.displayName] = 'installing';
            if(mod.version) {
                verCopy[mod.version.displayName] = 'force-not-installed';
            }
            this.setState({
                disableVersionInstall: true,
                versionState: verCopy
            })
            const newMod = Object.assign({}, mod);
            newMod.version = version;
            newMod.hosts.curse.fileID = version.hosts.curse.fileID;
            Curse.installModVersionToProfile(profile, newMod, true).then(() => {
                const verCop = Object.assign({}, this.state.versionState);
                verCop[version.displayName] = 'installed-done';
                this.setState({
                    activeMod: newMod,
                    versionState: verCop,
                    disableVersionInstall: false
                })

                this.reloadModsList();
            })
        })
    }

    render() {
        let { profile, disableVersionInstall, versionState, displayState, liveSearchTerm, searchTerm, listState, progressState, modsList, errorMod, activeMod } = this.state;
        return (
            <Page>
                <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                <EditContainer profile={profile}>
                    <Wrapper>
                        <Container>
                                <SearchContainer>
                                    {displayState !== 'modsList' && <Button onClick={this.goBack} color='red'>back</Button>}
                                    {displayState !== 'modsList' && displayState !== 'modInfo' && <Search onChange={this.searchChange} onKeyPress={this.searchChange} placeholder='Search' />}
                                    {listState !== 'viewAsset' && <>
                                        {displayState === 'modsList' && <Search value={liveSearchTerm} onChange={this.searchChange} onKeyPress={this.searchChange} placeholder='Search' />}
                                        {displayState === 'modsList' && <Button onClick={this.browseMods} color='green'>add</Button>}
                                        {displayState === 'addMods' && <Button onClick={this.addFromFile} color='green'>from file</Button>}
                                    </>}
                                </SearchContainer>
                                { displayState === 'modsList' && <>
                                <List>
                                    {modsList}
                                </List>
                                </>}
                                { displayState === 'modInfo' && <>
                                    <AssetInfo versionState={versionState} disableVersionInstall={disableVersionInstall} versionState={versionState} versionInstall={this.versionInstall} forceVersionFilter mcVerFilter={profile.minecraftversion} asset={activeMod} displayState={progressState} type='mod' localAsset />
                                </>}
                                {displayState === 'addMods' && <DiscoverList versionInstall={this.versionInstall} versionState={versionState} forceVersionFilter mcVerFilter={profile.minecraftversion} progressState={progressState} type='mod' installClick={this.installClick} searchTerm={searchTerm} state={listState} stateChange={this.listStateChange} />}
                                {this.state.invalidVersion && <Confirmation questionText={`There is no Minecraft ${profile.minecraftversion} version of ${errorMod.name}.`} hideConfirm cancelText='Ok' cancelDelete={() => {this.setState({invalidVersion: false})}} /> } 
                        </Container>
                    </Wrapper>
                </EditContainer>
            </Page>
        )   
    }

}