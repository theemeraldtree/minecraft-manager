import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import PageHeader from '../../component/pageheader/pageheader';
import Loader from '../../component/loader/loader';
import Profile from '../../util/profile';
import CardView from '../../component/cardview/cardview';
import CurseModpackCard from '../../component/cards/cursemodpack/cursemodpackcard';
import TextInput from '../../component/textinput/textinput';
import ProfileManager from '../../manager/profileManager';
import CurseManager from '../../manager/curseManager';
import Page from '../page';
import { Content, Main, Options } from '../page';
import styled from 'styled-components';
const Status = styled.p`
    color: #fff;
    margin: 0;
    margin-top: 10px;
    font-weight: bolder;
    margin-left: 10px;
    font-size: 30pt;
    left: 20px;
`
const Cards = styled(CardView)`
    padding-bottom: 0;
    padding-top: 0;
    margin-top: 0;
`
const Scrolling = styled.div`
    height: 100%;
    display: flex;
    flex: 1 1 auto;
`
const SearchInput = styled(TextInput)`
    float: right;
    margin-right: 40px;
`
class DiscoverCurseForgePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: new Profile(),
            loading: true,
            profiles: [],
            searchTerm: '',
            status: 'Most Popular Modpacks',
            searchID: 0
        };
    }
    componentWillMount = () => {
        ProfileManager.loadProfiles().then(() => {
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
                this.showTopPacks();
            }
        })

    }
    showTopPacks = () => {
        this.setState({
            status: 'Most Popular Modpacks'
        })
        CurseManager.getTopModpacks().then((res) => {
            this.processPacks(res);
        });
    }
    processPacks = (res) => {
        console.log(res);
        let list = [];
        for(let mod of res) {
            list.push(<CurseModpackCard profileManager={ProfileManager} cardClick={this.modpackClick} mod={mod} />);
        }

        this.setState({
            loading: false,
            profiles: list
        })
    }
    showSearchResults = (text, searchId) => {          
        CurseManager.getModpackSearchResults(text).then((res) => {
            if(this.state.searchID === searchId) {
                if(text === '') {
                    this.showTopPacks();
                }else{
                    this.processPacks(res);
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
            this.showTopPacks();
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

    modpackClick = (modpack) => {
        console.log(`/discover/curseforge/viewmodpack/${modpack.curseID}/${this.state.searchTerm}`);
        this.props.history.push(`/discover/curseforge/viewmodpack/${modpack.curseID}/${this.state.searchTerm}`);
    }
    render() {
        return (
            <Page>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader backURL='/discover' showBackButton title='Discover - CurseForge'>
                            <SearchInput onChange={this.searchChange} value={this.state.searchTerm} className='searchBoxHeader' label='FIND MODPACKS' />
                        </PageHeader>
                        <Scrolling>
                            <Loader loading={this.state.loading}>
                                <Options>
                                    <Cards>
                                        <Status>{this.state.status}</Status>
                                        {this.state.profiles}
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

export default withRouter(DiscoverCurseForgePage);