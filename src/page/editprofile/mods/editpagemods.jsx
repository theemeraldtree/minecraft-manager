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
    flex: 0 1 auto;
`
export default class EditPageMods extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modList: [],
            profile: {
                name: 'Loading'
            },
            displayState: 'modsList'
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
            let newModList = [];
            for(let mod of res) {
                newModList.push(<ModCard showInstall showDescription mod={mod} />);
            }

            this.setState({
                modList: newModList
            });
        })
    }

    goBack = () => {
        let { displayState } = this.state;
        let newState;
        switch(displayState) {
            case 'browseMods':
                newState = 'modsList'
                break;
            default:
                break;
        }

        this.setState({
            displayState: newState
        })
    }

    render() {
        let { profile, displayState } = this.state;
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
                                    <ModCard showDelete mod={{iconpath: logo, name: 'TESTMOD', version: 'TESTVER'}} />
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
                                    <Search placeholder='Search for mods' />
                                    <Button color='green'>more</Button>
                                </SearchContainer>
                                {this.state.modList.length !== 0 && 
                                    <List>
                                        {this.state.modList}
                                    </List>
                                }
                                {this.state.modList.length === 0 && <LoadingText>loading...</LoadingText>}
                            </>}
                        </Container>
                    </Wrapper>
                </EditContainer>
            </Page>
        )   
    }

}