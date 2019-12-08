import React, { PureComponent } from 'react';
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
import Mod from '../../../type/mod';
import path from 'path';
import fs from 'fs';
import Global from '../../../util/global';
import AssetInfo from '../../../component/assetinfo/assetinfo';
import ToastManager from '../../../manager/toastManager';
import Hosts from '../../../host/Hosts';
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


export default class EditPageMods extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            modsList: [],
            searchTerm: '',
            liveSearchTerm: '',
            displayState: 'modsList',
            listState: 'browseAssets',
            progressState: {},
            profile: {
                name: 'Loading'
            },
        }
    }

    static getDerivedStateFromProps(props) {
        const prof = ProfilesManager.getProfileFromID(props.match.params.id);
        return {
            profile: prof,
            progressState: prof.progressState
        }
    }

    updateProgressStates() {
        this.setState({
            progressState: this.state.profile.progressState
        });
        this.forceUpdate(); // this make it work i'm not sure why. don't remove
    }

    showInfoClick = (e) => {
        let mod = this.state.profile.getModFromID(e.currentTarget.dataset.assetid);
        if(mod.hosts.curse) {
            if(!(mod instanceof Mod)) {
                mod = new Mod(mod);
            }
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
            });
        }
        if(e.key === 'Enter') {
            this.setState({
                searchTerm: term,
                listState: 'browseAssets'
            })
        }
    }

    installClick = async (e) => {
        e.stopPropagation();
        let { profile } = this.state;
        let cachedID = e.currentTarget.parentElement.parentElement.dataset.cachedid;
        let mod = Hosts.cache.assets[cachedID];
        let id = mod.id;
        profile.progressState[id] = {
            progress: 'installing',
            version: `temp-${new Date().getTime()}`
        }
        this.updateProgressStates();
        try {
           await Hosts.installModToProfile('curse', this.state.profile, mod);
           this.updateProgressStates();
        }catch(err) {
            if(err === 'no-version-available') {
                profile.progressState[id].progress = 'notavailable';
                this.updateProgressStates();
                ToastManager.createToast(`Error`, `There is no Minecraft ${profile.minecraftversion} version of ${mod.name} available.`);
            }
        }
    }

    deleteClick = (e) => {
        e.stopPropagation();
        let mod = this.state.profile.getModFromID(e.currentTarget.parentElement.parentElement.dataset.assetid);
        this.state.profile.deleteMod(mod).then(() => {
            this.setState({
                mods: this.state.profile.mods
            })
            this.updateProgressStates();
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
                files: [
                    {
                        displayname: 'Main JAR File',
                        type: 'jar',
                        priority: 'mainFile',
                        path: filename
                    }
                ],
                version: {
                    displayName: filename
                }
            });
            fs.copyFileSync(pth, path.join(profile.modsPath, filename));
            profile.addMod(mod);
        }
    }

    versionInstall = (version, mod) => {
        const { profile } = this.state;
        profile.deleteMod(mod).then(() => {
            profile.progressState[mod.id] = {
                progress: 'installing',
                version: version.displayName
            }
            this.updateProgressStates();
            const newMod = Object.assign({}, mod);
            newMod.version = version;
            newMod.hosts.curse.fileID = version.hosts.curse.fileID;
            Hosts.installModVersionToProfile('curse', profile, newMod, true).then(() => {
                profile.progressState[mod.id] = {
                    progress: 'installed',
                    version: version.displayName
                }
                this.updateProgressStates();
            })
        })
    }

    render() {
        let { profile, progressState, disableVersionInstall, displayState, liveSearchTerm, searchTerm, listState, activeMod } = this.state;
        const { mods } = profile;
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
                                    {mods.map(mod => {
                                        if(this.state.displayState === 'modsList') {
                                            if(mod.name.toLowerCase().includes(this.state.liveSearchTerm.toLowerCase())) {
                                                return <AssetCard progressState={progressState} key={mod.id} asset={mod} showDelete onClick={this.showInfoClick} deleteClick={this.deleteClick} />;
                                            }
                                        }
                                    })}
                                </List>
                                </>}
                                { displayState === 'modInfo' && <>
                                    <AssetInfo 
                                        host={activeMod.getPrimaryHost()}
                                        allowVersionReinstallation 
                                        specificMCVer={profile.minecraftversion} 
                                        progressState={progressState[activeMod.id]} 
                                        disableVersionInstall={disableVersionInstall} 
                                        versionInstall={this.versionInstall} 
                                        forceVersionFilter 
                                        mcVerFilter={profile.minecraftversion} 
                                        asset={activeMod} 
                                        displayState={progressState} 
                                        type='mod' 
                                        localAsset />
                                </>}
                                {displayState === 'addMods' && <DiscoverList 
                                host='curse'
                                allowVersionReinstallation 
                                specificMCVer={profile.minecraftversion} 
                                disableVersionInstall 
                                versionInstall={this.versionInstall} 
                                forceVersionFilter 
                                mcVerFilter={profile.minecraftversion} 
                                progressState={progressState} 
                                type='mod' 
                                installClick={this.installClick} 
                                searchTerm={searchTerm} 
                                state={listState} 
                                stateChange={this.listStateChange} />}
                        </Container>
                    </Wrapper>
                </EditContainer>
            </Page>
        )   
    }

}