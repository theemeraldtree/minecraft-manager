import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import ProfileManager from '../../manager/profileManager';
import PageHeader from '../../component/pageheader/pageheader';
import Profile from '../../util/profile';
import Loader from '../../component/loader/loader';
import TextInput from '../../component/textinput/textinput';
import CurseManager from '../../manager/curseManager';  
import Badge from '../../component/badge/badge';
import WideButton from '../../component/button/widebutton/widebutton';
import EditBar from './component/editbar';
import Dropdown from '../../component/dropdown/dropdown';
import ListButton from '../../component/button/listbutton/listbutton'
import GeneralUtils from '../../util/generalUtils'
import IconButton from '../../component/button/iconbutton/iconbutton';
import Page, { Main, Content } from '../page';
import EditOptions from './component/editoptions';
import EditContainer from './component/editcontainer';
import styled from 'styled-components';
const ListContainer = styled.div`
    margin-left: 20px;
    padding-right: 25px;
    height: 100%;
    width: 45%;
    max-width: 300px;
    overflow: hidden;
    background-color: #3D3D3D;
    display: flex;
    flex-flow: column;
    position: relative;
`
const List = styled.div`
    min-height: 300px;
    border-radius: 10px;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
    padding-right: 10px;
    padding-left: 10px;
`
const CustomOptions = styled(EditOptions)`
    width: 100%;
    display: flex;
    height: 100%;
`
const SearchInput = styled(TextInput)`
    width: 75%;
    display: inline-block;
    left: 10px;
`
const SearchButton = styled(IconButton)`
    display: inline-block;
    position: absolute;
    left: 81%;
    top: 30px;
    z-index: 20;
`
const ModDetails = styled.div`
    width: 43%;
    max-width: 510px;
    background-color: #3D3D3D;
    margin-left: 10px;
    padding-left: 10px;
    padding-top: 10px;
    position: relative;
`
const ImageContainer = styled.div`
    width: 10vw;
    border: 2px solid darkgray;
    border-radius: 13px;
    height: 10vw;
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
`
const Image = styled.img`
    border-radius: 10px;
    width: 100%;
`
const ModDetailsTitle = styled.p`
    color: white;
    font-size: 30pt;
    margin: 0;
    font-weight: bolder;
`
const ModDetailsDesc = styled.p`
    color: white;
    font-size: 13pt;
`
const ModDetailsLabel = styled.p`
    color: white;
    margin: 0;
    font-weight: bolder;
    font-size: 18pt;
`
const VersionDropdown = styled(Dropdown)`
    width: 80%;
`
const BadgesWrapper = styled.div`
    position: absolute;
    bottom: 30px;
    left: 20px;
    >* {
        margin: 5px;
    }
`
class EditModsPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: new Profile(),
            loading: true,
            mods: [],
            searchTerm: '',
            selectedMod: {'id': ''},
            modfiles: [{value: 'LOADING', name: 'LOADING'}],
            versionChanging: false,
            modversion: 'LOADING',
            versionChangeStatus: ''
        }
    }
    searchChange = (e) => {

        let search = e.target.value;
        this.setState({
            searchTerm: search
        })
        if(search === '') {
            this.showList();
        }else{
            let toShow = this.state.profile.mods.filter(mod => mod.name.toUpperCase().includes(search.toUpperCase()));

            let list = [];
            for(let mod of toShow) {
                let selected = false;
                if(this.state.selectedMod.id === mod.id) {
                    selected = true;
                }
                console.log(selected);
                list.push(<ListButton selected={selected} onClick={this.modClick} data={{"modid":mod.id}} key={mod.id}>{mod.name}</ListButton>);
            }
            if(list.length === 0) {
                list = [<ListButton key='mcm-noresultsfound'>No results found</ListButton>];
            }
            this.setState({
                mods: list
            });
        }

    }
    showList = () => {
        console.log('list show');
        let list = [];
        let sort = this.state.profile.mods;
        sort.sort(GeneralUtils.objSort("name"));
        for(let mod of sort) {
            let selected = false;
            if(this.state.selectedMod.id === mod.id) {
                selected = true;
            }
            list.push(<ListButton selected={selected} onClick={this.modClick} data={{"modid":mod.id}} key={mod.id}>{mod.name}</ListButton>);
        }
        this.setState({
            mods: list
        })
    }
    componentWillMount() {
        ProfileManager.loadProfiles().then(() => {
            let profile = ProfileManager.getProfileFromId(this.props.match.params.id);
            this.setState({
                profile: profile,
                loading: false
            });
            this.showList();
        })
    }
    modClick = (e) => {
        let mod, elem;
        //as
        if(e.target.tagName === 'P') {
            elem = e.target.parentNode;
        }else{
            elem = e.target;
        }
        let dataset = JSON.parse(elem.dataset.data);
        for(let modi of this.state.profile.mods) {
            if(modi.id === dataset.modid) {
                mod = modi;
            }
        }

        this.setState({
            selectedMod: mod,
            modfiles: [{value: 'LOADING', name: 'LOADING'}]
        }, () => {
            this.getModFiles();
            if(this.state.searchTerm !== '') {
                this.searchChange({target: {value: this.state.searchTerm}});
            }else{
                this.showList();
            }
        })
        
    }
    addClick = () => {
        this.props.history.push(`/profiles/edit/${this.state.profile.id}/addmods/{}`);
    }
    removeMod = () => {
        this.state.profile.deleteMod(this.state.selectedMod).then(() => {
            this.showList();
            this.setState({
                selectedMod: {'id': ''}
            })
        })
    }
    getModFiles = () => {
        console.log(this.state.selectedMod.type);
        if(this.state.selectedMod.type === 'curse') {
            CurseManager.getModFiles(this.state.selectedMod, this.state.profile.mcVersion).then((modfiles) => {
                let list = [];
                let versionBinds = {};
                for(let item of modfiles) {
                    list.push({value: item.fileID, name: item.name});
                    versionBinds[item.fileID] = item.name;
                }
                console.log(list);
                this.setState({
                    modfiles: list,
                    versionBinds: versionBinds,
                    modversion: this.state.selectedMod.curseFileId
                })
            })
        }else{
            this.setState({
                modfiles: [{value: 'none', name: 'No versions available'}]
            });
        }

    }
    changeVersion = (e) => {
        let name = this.state.versionBinds[e.target.value];
        this.setState({
            modversion: e.target.value
        }, () => {
            this.state.profile.changeModVersion(this.state.selectedMod, this.state.modversion, name, (update) => {
                this.setState({
                    versionChanging: true,
                    versionChangeStatus: update
                })
            }).then(() => {
                this.setState({
                    versionChanging: false
                })
                this.forceUpdate();
            })
        })
    }
    render() {
        return (
            <Page>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader backURL={`/profiles/viewprofile/${this.state.profile.id}`} showBackButton title='Edit - Mods' />
                        <EditContainer>
                            <EditBar profile={this.state.profile}/>
                            <Loader loading={this.state.loading}>
                                <CustomOptions>
                                    <ListContainer>
                                        <SearchInput onChange={this.searchChange} size='small' label='SEARCH' />
                                        <SearchButton onClick={this.addClick} showTooltip tooltipAlign='bottom' tooltip='Add Mods' type='add' />
                                        <List>
                                            {this.state.mods}
                                        </List>
                                    </ListContainer>
                                    {this.state.selectedMod.id !== '' ? <ModDetails>
                                        <ImageContainer>
                                            <Image src={this.state.selectedMod.icon} />
                                        </ImageContainer>
                                        <ModDetailsTitle>{this.state.selectedMod.name}</ModDetailsTitle>
                                        <ModDetailsDesc>{this.state.selectedMod.description}</ModDetailsDesc>

                                        <WideButton onClick={this.removeMod} type='delete'>REMOVE</WideButton>
                                        {!this.state.versionChanging && <div>
                                            <ModDetailsLabel>VERSION</ModDetailsLabel>
                                            <VersionDropdown value={this.state.modversion} onChange={this.changeVersion} list={this.state.modfiles} />
                                        </div>}
                                        {this.state.versionChanging && <p className='status'>{this.state.versionChangeStatus}</p>}
                                        <BadgesWrapper>
                                            <Badge color='green'>Version: {this.state.selectedMod.version}</Badge>
                                            <Badge color='yellow'>File: {this.state.selectedMod.file}</Badge>
                                        </BadgesWrapper>
                                    </ModDetails> : <ModDetails>
                                        <ModDetailsTitle>No Mod Selected</ModDetailsTitle>
                                    </ModDetails>}
                                </CustomOptions>
                            </Loader>
                        </EditContainer>
                    </Content>
                </Main>
            </Page>
        )
    }
}

export default withRouter(EditModsPage);