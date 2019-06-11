import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import PageHeader from '../../component/pageheader/pageheader';
import Loader from '../../component/loader/loader';
import Profile from '../../util/profile';
import CardView from '../../component/cardview/cardview';
import TextInput from '../../component/textinput/textinput';
import ProfileManager from '../../manager/profileManager';
import CurseManager from '../../manager/curseManager';
import styled from 'styled-components';
import Data from '../../util/data';
import FileUtils from '../../util/fileUtils';
import Page, { Options, Main, Content } from '../page';
import Mod from '../../util/mod';
import IconButton from '../../component/button/iconbutton/iconbutton';
import fs from 'fs';
import AssetCard from '../../component/cards/assetcard/assetcard';
const { dialog } = require('electron').remote;
const path = require('path');
const StatusText = styled.p`
    color: white;
    margin: 0;
    margin-top: 10px;
    font-weight: bolder;
    margin-left: 10px;
    font-size: 30pt;
    left: 20px;
`
const Scrolling = styled.div`
    height: 100%;
    display: flex;
    flex: 1 1 auto;
`
const Cards = styled(CardView)`
    padding-bottom: 0;
    padding-top: 0;
    margin-top: 0;
`
const FileButton = styled(IconButton)`
    display: inline-block;
    left: 380px;
    top: 10px;
`
const SearchInput = styled(TextInput)`
    float: right;
    margin-right: 40px;
`
class AddModsPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: new Profile(),
            loading: true,
            mods: [],
            searchTerm: '',
            status: 'Most Popular Mods',
            searchID: 0
        };
    }
    componentWillMount = () => {
        ProfileManager.loadProfiles().then(() => {
            let profile = ProfileManager.getProfileFromId(this.props.match.params.id);
            this.setState({
                profile: profile
            });
            console.log(this.props.match.params.searchTerm);
            let rawSearchTerm = this.props.match.params.searchTerm;
            let searchTerm = JSON.parse(rawSearchTerm).searchTerm
            if(searchTerm !== undefined) {
                this.setState({
                    searchTerm: searchTerm,
                    loading: false
                }, () => {
                    this.showSearchResults(searchTerm, 0)
                })
            }else{
                this.showTopMods();
            }
        });
    }
    showTopMods = () => {
        this.setState({
            status: 'Most Popular Mods'
        })
        CurseManager.getTopMods().then((res) => {
            this.processMods(res);
        });
    }
    processMods = (res) => {
        console.log(res);
        let list = [];
        for(let mod of res) {
            list.push(<AssetCard cardClick={this.modClick} profile={this.state.profile} asset={mod} />);
        }

        this.setState({
            loading: false,
            mods: list
        })
    }
    showSearchResults = (text, searchId) => {          
        CurseManager.getModSearchResults(text).then((res) => {
            if(this.state.searchID === searchId) {
                if(text === '') {
                    this.showTopMods();
                }else{
                    this.processMods(res);
                    this.showSearchResults(text, -1);
                    this.setState({
                        searchID: 0,
                        status: `Search Results for: ${text}`,
                        loading: false
                    })
                }
            }
        })
    }
    searchChange = (e) => {
        this.setState({
            searchTerm: e.target.value
        })
        let text = e.target.value;
        if(text === '') {
            this.showTopMods();
            return;
        }

        let newId = this.state.searchID + 1
        this.setState({
            loading: true,
            searchID: newId
        }, () => {
            setTimeout(() => {
                this.showSearchResults(text, this.state.searchID);
            }, 1000)
        });


    }

    modClick = (mod) => {
        console.log(`/profiles/viewmod/${mod.ids.curse}/${this.state.profile.id}/${this.state.searchTerm}`);
        this.props.history.push(`/profiles/viewmod/${mod.ids.curse}/${this.state.profile.id}/${this.state.searchTerm}`);
    }
    addFile = () => {
        let file = dialog.showOpenDialog({properties: ['openFile'], filters:[{name: 'JAR Files', extensions: ['jar']}]})[0];
        if(fs.existsSync(file)) {
            // Read the file and look for mcmod.info for any info about the mod
            let modname = path.parse(file).name;
            let fileraw = `${modname}.jar`;
            let mod = new Mod({name: modname, file: fileraw, id: Data.createId(modname), icon: '', type: 'file', 'curseFileId': '', curseID: '', epochDate: (new Date()).getTime()});
            FileUtils.copyFile(file, path.join(FileUtils.getAppPath(), `/profiles/${this.state.profile.id}/files/mods/${fileraw}`));
            this.state.profile.mods.push(mod);
            this.state.profile.save();
        }
    }
    render() {
        return (
            <Page>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader backURL={`/profiles/edit/${this.state.profile.id}/mods`} showBackButton title='Edit - Add Mods'>
                            <FileButton onClick={this.addFile} type='file' showTooltip tooltipAlign='bottom' tooltip='Add file manually' />
                            <SearchInput onChange={this.searchChange} value={this.state.searchTerm} className='searchBoxHeader' label='FIND MODS' />
                        </PageHeader>
                        <Scrolling>
                            <Loader loading={this.state.loading}>
                                <Options>
                                    <Cards>
                                        <StatusText>{this.state.status}</StatusText>
                                        {this.state.mods}
                                    </Cards>
                                </Options>
                            </Loader>
                        </Scrolling>
                    </Content>
                </Main>
            </Page>
        )
    }
}

export default withRouter(AddModsPage);