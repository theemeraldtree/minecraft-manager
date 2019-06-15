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
        let { profile } = this.state;
        let newList = [];
        let ps = {};
        for(let mod of profile.mods) {
            ps[mod.id] = 'installed';
            newList.push(<AssetCard key={mod.id} asset={mod} showDelete deleteClick={this.deleteClick} />);
        }

        this.setState({
            modsList: newList,
            progressState: ps
        })
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
        this.setState({
            liveSearchTerm: term
        });
        if(e.key === 'Enter') {
            this.setState({
                searchTerm: term
            })
        }
    }

    installClick = (e) => {
        e.stopPropagation();
        let cachedID = e.currentTarget.parentElement.parentElement.dataset.cachedid;
        let mod = Curse.cachedItems[cachedID];
        let id = mod.id;
        let ps = Object.assign({}, this.state.progressState);
        ps[id] = 'installing';
        this.setState({
            progressState: ps
        }, () => {
            Curse.installMod(this.state.profile, mod, false).then(() => {
                this.reloadModsList();
            }).catch((err) => {
                if(err === 'invalidVersion') {
                    let ps = Object.assign({}, this.state.progressState);
                    ps[id] = 'notavailable';
                    this.setState({
                        invalidVersion: true,
                        errorMod: mod,
                        progressState: ps
                    })
                }
            });
        });
    }

    deleteClick = (e) => {
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

    render() {
        let { profile, displayState, liveSearchTerm, searchTerm, listState, progressState, modsList, errorMod } = this.state;
        return (
            <Page>
                <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                <EditContainer profile={profile}>
                    <Wrapper>
                        <Container>
                                <SearchContainer>
                                    {displayState !== 'modsList' && <Button onClick={this.goBack} color='red'>back</Button>}
                                    {listState !== 'viewAsset' && <>
                                        <Search value={liveSearchTerm} onChange={this.searchChange} onKeyPress={this.searchChange} placeholder='Search' />
                                        {displayState === 'modsList' && <Button onClick={this.browseMods} color='green'>add</Button>}
                                        {displayState === 'addMods' && <Button onClick={this.addFromFile} color='green'>from file</Button>}
                                    </>}
                                </SearchContainer>
                                { displayState === 'modsList' && <>
                                <List>
                                    {modsList}
                                </List>
                                </>}
                                {displayState === 'addMods' && <DiscoverList progressState={progressState} type='mods' installClick={this.installClick} searchTerm={searchTerm} state={listState} stateChange={this.listStateChange} />}
                                {this.state.invalidVersion && <Confirmation questionText={`There is no Minecraft ${profile.minecraftversion} version of ${errorMod.name}.`} hideConfirm cancelText='Ok' cancelDelete={() => {this.setState({invalidVersion: false})}} /> } 
                        </Container>
                    </Wrapper>
                </EditContainer>
            </Page>
        )   
    }

}