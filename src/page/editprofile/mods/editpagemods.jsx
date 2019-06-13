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
        console.log(profile.mods);
        let ps = Object.assign({}, this.state.progressState);
        for(let mod of profile.mods) {
            ps[mod.id] = 'installed';
            newList.push(<AssetCard key={mod.id} asset={mod} showDelete deleteClick={this.deleteClick} />);
        }

        console.log(newList);

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
        this.setState({
            displayState: 'addMods',
            liveSearchTerm: ''
        })
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
                console.log('done');
                this.reloadModsList();
            });
        });
    }

    deleteClick = (e) => {
        let mod = this.state.profile.getModFromID(e.currentTarget.parentElement.parentElement.dataset.assetid);
        console.log(mod);
        this.state.profile.deleteMod(mod).then(() => {
            this.reloadModsList();
        })
    }

    render() {
        let { profile, displayState, liveSearchTerm, searchTerm, listState, progressState, modsList } = this.state;
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
                                        <Button onClick={this.browseMods} color='green'>add</Button>
                                    </>}
                                </SearchContainer>
                                { displayState === 'modsList' && <>
                                <List>
                                    {modsList}
                                </List>
                                </>}
                                {displayState === 'addMods' && <DiscoverList progressState={progressState} type='mods' installClick={this.installClick} searchTerm={searchTerm} state={listState} stateChange={this.listStateChange} />}
                        </Container>
                    </Wrapper>
                </EditContainer>
            </Page>
        )   
    }

}