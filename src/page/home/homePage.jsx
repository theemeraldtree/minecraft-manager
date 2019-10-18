import React, { PureComponent } from 'react';
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
import ImportOverlay from '../../component/importoverlay/importoverlay';
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
export default class HomePage extends PureComponent {
    constructor() {
        super();
        this.state = {
            searchTerm: '',
            showCreate: false,
            createName: '',
            mcVersion: Global.MC_VERSIONS[0],
            showImport: false
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
        const input = e.target.value;
        const names = ProfilesManager.loadedProfiles.map(prof => prof.id);
        if(input.trim() !== '' && !names.includes(Global.createID(input))) {
            this.setState({
                nameEntered: true
            })
        }else{
            this.setState({
                nameEntered: false
            })
        }
        this.setState({
            createName: input
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
    
    importClick = () => {
        this.setState({
            showImport: true
        })
    }

    importCancel = () => {
        this.setState({
            showImport: false
        })
    }
    render() {
        let { searchTerm, showCreate, showImport } = this.state;
        return (
            <Page>              
                <Header title='profiles'>
                    <SearchBox onChange={this.searchChange} placeholder='search' />
                    <Button onClick={this.importClick} color='purple'>import</Button>
                    <Button onClick={this.showCreate} color='green'>create</Button>
                </Header>
                <ProfileGrid searchTerm={searchTerm} />
                {showImport && <ImportOverlay cancelClick={this.importCancel} />}
                {showCreate && 
                <Overlay>
                    <CreateBG>
                        <Title>create a new profile</Title>
                        <Detail>profile name</Detail>
                        <TextInput onChange={this.createNameChange} />
                        <Detail>minecraft version</Detail>
                        <CustomDropdown onChange={this.mcverChange} items={Global.MC_VERSIONS} />

                        <Detail>looking to download a modpack? head to the discover section on the sidebar</Detail>
                        <CreateControls>
                            <Button onClick={this.createCancel} color='red'>cancel</Button>
                            <Button disabled={!this.state.nameEntered} onClick={this.create} color='green'>create</Button>
                        </CreateControls>
                    </CreateBG>
                </Overlay>}
            </Page>
        )
    }

}