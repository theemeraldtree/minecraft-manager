import React, { Component } from 'react';
import styled from 'styled-components';
import Page from '../page';
import Header from '../../component/header/header';
import SearchBox from '../../component/searchbox/searchbox';
import Button from '../../component/button/button';
import ProfileGrid from './components/profilegrid';
import Detail from '../../component/detail/detail';
import TextInput from '../../component/textinput/textinput';
import ProfilesManager from '../../manager/profilesManager';
import Overlay from '../../component/overlay/overlay';
import CustomDropdown from '../../component/customdropdown/customdropdown';
import Global from '../../util/global';

const CreateBG = styled.div`
    max-width: 600px;
    max-height: 400px;
    width: 100%;
    height: 100%;
    background-color: #444444;
    color: white;
    padding: 10px;
    position: relative;
    margin: 20px;
`

const Title = styled.p`
    font-weight: 300;
    margin: 0;
    font-size: 23pt;
`

const CreateControls = styled.div`
    position: absolute;
    bottom: 10px;
    right: 10px;
    div {
        margin: 2px;
    }
`
export default class HomePage extends Component {
    constructor() {
        super();
        this.state = {
            searchTerm: '',
            showCreate: false,
            createName: '',
            mcVersion: Global.MC_VERSIONS[0]
        }
    }

    searchChange = (e) => {
        this.setState({
            searchTerm: e.target.value.toLowerCase()
        })
    }

    createCancel = () => {
        this.setState({
            showCreate: false
        });
    }

    showCreate = () => {
        this.setState({
            showCreate: true
        })
    }

    createNameChange = (e) => {
        this.setState({
            createName: e.target.value
        })
    }

    create = () => {
        ProfilesManager.createProfile(this.state.createName, this.state.mcVersion).then(() => {
            this.setState({
                showCreate: false
            })
        })
    }

    mcverChange = (val) => {
        this.setState({
            mcVersion: val
        })
    }
    
    render() {
        let { searchTerm, showCreate } = this.state;
        return (
            <Page>
                <Header title='profiles'>
                    <SearchBox onChange={this.searchChange} placeholder='search' />
                    <Button color='purple'>import</Button>
                    <Button onClick={this.showCreate} color='green'>create</Button>
                </Header>
                <ProfileGrid searchTerm={searchTerm} />
                {showCreate && 
                <Overlay>
                    <CreateBG>
                        <Title>create a new profile</Title>
                        <Detail>profile name</Detail>
                        <TextInput onChange={this.createNameChange} />
                        <Detail>minecraft version</Detail>
                        <CustomDropdown onChange={this.mcverChange} items={Global.MC_VERSIONS} />

                        <CreateControls>
                            <Button onClick={this.createCancel} color='red'>cancel</Button>
                            <Button onClick={this.create} color='green'>create</Button>
                        </CreateControls>
                    </CreateBG>
                </Overlay>}
            </Page>
        )
    }

}