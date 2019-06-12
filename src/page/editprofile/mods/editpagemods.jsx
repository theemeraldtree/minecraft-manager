import React, { Component } from 'react';
import styled from 'styled-components';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer';
import InputContainer from '../components/inputcontainer';
import TextInput from '../../../component/textinput/textinput';
import Button from '../../../component/button/button';
import ModCard from '../../../component/modcard/modcard';
import Curse from '../../../host/curse/curse';
import logo from '../../../img/logo-sm.png';
import SanitizedHTML from '../../../component/sanitizedhtml/sanitizedhtml';

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

const LoadingText = styled.div`
    font-size: 23pt;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
`
const SearchContainer = styled(InputContainer)`
    margin-top: 10px;
    flex-shrink: 0;
    background-color: #717171;
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
export default class EditPageMods extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modList: [],
            searchTerm: '',
            profile: {
                name: 'Loading'
            },
            previousState: '',
            displayState: 'modsList',
            previewState: 'description'
        }
    }

    static getDerivedStateFromProps(props) {
        return {
            profile: ProfilesManager.getProfileFromID(props.match.params.id)
        }
    }
    
    browseMods = () => {
        this.setState({
            displayState: 'browseMods'
        })

        Curse.getPopular('mods').then((res) => {
            this.renderMods(res);
        })
    }

    renderMods = (mods) => {
        console.log(mods);
        let newModList = [];
        let { displayState } = this.state;
        if(mods.length >= 1) {
            for(let mod of mods) {
                newModList.push(<ModCard key={mod.id} onClick={this.showMod} showInstall={displayState === 'browseMods'} showBlurb={displayState === 'browseMods'} mod={mod} />);
            }
        }else{
            newModList.push(<LoadingText key='none'>No Mods Found</LoadingText>);
        }

        this.setState({
            modList: newModList
        });
    }

    showMod = (e) => {
        let { displayState } = this.state;
        if(displayState === 'browseMods') {
            let mod = Curse.cachedItems[e.currentTarget.dataset.cachedid];
            this.setState({
                previousState: 'browseMods',
                displayState: 'viewMod',
                previewState: 'description',
                activeMod: mod,
                loadedDetailedInfo: false
            }, () => {
                this.showDescription();
            });
        }
    }

    goBack = () => {
        let { displayState, previousState } = this.state;
        let newState;
        switch(displayState) {
            case 'browseMods':
                newState = 'modsList';
                break;
            case 'viewMod':
                newState = previousState;
                break;
            default:
                break;
        }

        this.setState({
            displayState: newState
        })
    }

    browseSearch = (e) => {
        let term = e.target.value;
        let { displayState } = this.state;
        this.setState({
            searchTerm: term
        });
        if(e.key === 'Enter') {
            this.setState({
                modList: []
            });
            if(displayState === 'browseMods') {
                if(term.trim() !== '') { 
                    Curse.search(term, 'mods').then((res) => {
                        this.renderMods(res);
                    });
                }else{
                    this.browseMods();
                }
            }
        }
    }

    showDescription = () => {
        Curse.getInfo(this.state.activeMod).then((res) => {
            this.setState({
                activeMod: res,
                loadedDetailedInfo: true
            })
        })
    }
    showDependencies = () => {
        let newMod = Object.assign({}, this.state.activeMod);
        newMod.dependencies = [];
        Curse.getDependencies(this.state.activeMod).then((res) => {
            newMod.dependencies = res;

            let newDependList = [];
            if(res.length >= 1) {
                for(let mod of res) {
                    newDependList.push(<ModCard showInstall={true} disableHover key={mod.id} showBlurb={true} mod={mod} />);
                }
            }else{
                newDependList.push(<LoadingText key='none'>No Dependencies</LoadingText>);
            }
    
            this.setState({
                activeMod: newMod,
                modDependencies: newDependList,
                loadedDetailedInfo: true
            });
        });
    }
    previewStateSwitch = (e) => {
        let newState = e.currentTarget.dataset.state;

        this.setState({
            previewState: newState,
            loadedDetailedInfo: false
        });
        if(newState === 'description') {
            this.showDescription();
        }else if(newState === 'dependencies') {
            this.showDependencies();
        }
    }

    render() {
        let { profile, displayState, activeMod, modList, loadedDetailedInfo, searchTerm, previewState } = this.state;
        return (
            <Page>
                <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                <EditContainer profile={profile}>
                    <Wrapper>
                        <Container>
                            { displayState === 'modsList' && <>
                                <SearchContainer>
                                    <Search placeholder='Search' />
                                    <Button onClick={this.browseMods} color='green'>add</Button>
                                </SearchContainer>
                                <List>
                                    <ModCard onClick={this.showMod} showDelete mod={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <ModCard showDelete mod={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <ModCard showDelete mod={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <ModCard showDelete mod={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <ModCard showDelete mod={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <ModCard showDelete mod={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <ModCard showDelete mod={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <ModCard showDelete mod={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                    <ModCard showDelete mod={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
                                </List>
                            </>}
                            {displayState === 'browseMods' && <>
                                <SearchContainer>
                                    <Button onClick={this.goBack} color='red'>back</Button>
                                    <Search value={searchTerm} onChange={this.browseSearch} onKeyPress={this.browseSearch} placeholder='Search for mods' />
                                    <Button color='green'>more</Button>
                                </SearchContainer>
                                {modList.length !== 0 && 
                                    <List>
                                        {modList}
                                    </List>
                                }
                                {modList.length === 0 && <LoadingText>loading...</LoadingText>}
                            </>}
                            {displayState === 'viewMod' && <>
                                <SearchContainer>
                                    <Button onClick={this.goBack} color='red'>back</Button>
                                </SearchContainer>
                                <ModCard disableHover showInstall installed={false} mod={activeMod} showBlurb />
                                <HeaderButtons>
                                    <HB active={previewState === 'description'} onClick={this.previewStateSwitch} data-state='description'>Description</HB>
                                    <HB active={previewState === 'dependencies'} onClick={this.previewStateSwitch} data-state='dependencies'>Dependencies</HB>
                                </HeaderButtons>
                                {loadedDetailedInfo && <>

                                    {previewState === 'description' && 
                                        <Description>
                                            <SanitizedHTML html={activeMod.description} />
                                        </Description>
                                    }

                                    {previewState === 'versions' &&
                                        <h1>versions</h1>
                                    }

                                    {previewState === 'dependencies' &&
                                        <List>
                                            {this.state.modDependencies}
                                        </List>
                                    }
                                </>}

                                {!loadedDetailedInfo && <LoadingText>loading...</LoadingText>}
                            </>}
                        </Container>
                    </Wrapper>
                </EditContainer>
            </Page>
        )   
    }

}