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
    overflow: scroll;
    margin-top: 10px;
`

const Search = styled(TextInput)`
    width: 100%;
`

const SearchContainer = styled(InputContainer)`
    margin-top: 10px;
    flex: 0 1 auto;
`
export default class EditPageMods extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: {
                name: 'Loading'
            }
        }
    }

    static getDerivedStateFromProps(props) {
        return {
            profile: ProfilesManager.getProfileFromID(props.match.params.id)
        }
    }
    
    render() {
        let { profile } = this.state;
        return (
            <Page>
                <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                <EditContainer profile={profile}>
                    <Wrapper>
                        <Container>
                            <SearchContainer>
                                <Search placeholder='Search' />
                                <Button color='green'>add</Button>
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
                        </Container>
                    </Wrapper>
                </EditContainer>
            </Page>
        )   
    }

}