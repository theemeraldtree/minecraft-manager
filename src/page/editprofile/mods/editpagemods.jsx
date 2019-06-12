import React, { Component } from 'react';
import styled from 'styled-components';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer';
import TextInput from '../../../component/textinput/textinput';
import Button from '../../../component/button/button';
import logo from '../../../img/logo-sm.png';
import DiscoverList from '../../../component/discoverlist/discoverlist';
import InputContainer from '../components/inputcontainer';
import AssetCard from '../../../component/assetcard/assetcard';

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
            modList: [],
            searchTerm: '',
            liveSearchTerm: '',
            displayState: 'modsList',
            listState: 'browseAssets',
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

    render() {
        let { profile, displayState, liveSearchTerm, searchTerm, listState } = this.state;
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
                                    <AssetCard showDelete asset={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <AssetCard showDelete asset={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <AssetCard showDelete asset={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <AssetCard showDelete asset={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <AssetCard showDelete asset={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <AssetCard showDelete asset={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <AssetCard showDelete asset={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <AssetCard showDelete asset={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <AssetCard showDelete asset={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <AssetCard showDelete asset={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                </List>
                                </>}
                                {displayState === 'addMods' && <DiscoverList type='mods' searchTerm={searchTerm} state={listState} stateChange={this.listStateChange} />}
                        </Container>
                    </Wrapper>
                </EditContainer>
            </Page>
        )   
    }

}