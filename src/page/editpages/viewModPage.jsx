import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import PageHeader from '../../component/pageheader/pageheader';
import Loader from '../../component/loader/loader';
import Profile from '../../util/profile';
import ProfileManager from '../../manager/profileManager';
import CurseManager from '../../manager/curseManager';
import Page, { Main, Content, Options } from '../page'
import ModInfo from '../../component/modinfo/modinfo';
import CurseDescription from '../../component/cursedescription/cursedescription';
import styled from 'styled-components';
const CurseDescLabel = styled.p`
    color: white;
    margin: 0;
    font-weight: bolder;
    margin-top: 30px;
    font-size: 20pt;
    margin-left: 70px;
`
const cheerio = require('cheerio');
class ViewModPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: new Profile(),
            loading: true,
            mod: {'name': 'Loading', mcVersions: ['Error']},
            curseDesc: '',
            searchTerm: ''
        };
    }
    componentWillMount = () => {
        ProfileManager.loadProfiles().then(() => {
            let profile = ProfileManager.getProfileFromId(this.props.match.params.profile);
            this.setState({
                profile: profile
            });
        });

        let searchTerm = this.props.match.params.searchTerm;
        if(searchTerm != undefined) {
            this.setState({
                searchTerm: searchTerm
            })
        }

        console.log(this.props.match.params.mod);
        CurseManager.getDetailedModInfo(this.props.match.params.mod, true).then((mod) => {
            console.log(mod);
            this.setState({
                mod: mod,
                loading: false
            }, () => {
                this.processHTML();
            })
        })
    }
    processHTML = () => {
        let html = this.state.mod.curseDescription;
        let page = cheerio.load(html);
        page('a').addClass('browser-link');
        page('a').attr('target', '_blank');
        this.setState({
            curseDesc: page.html()
        })
    }
    render() {
        return (
            <Page>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <Loader loading={this.state.loading}>
                            <Options>
                                <PageHeader backURL={`/profiles/edit/${this.state.profile.id}/addmods/{"searchTerm": "${this.state.searchTerm}"}`} showBackButton title={`${this.state.mod.name}`} />

                                <ModInfo name={this.state.mod.name} icon={this.state.mod.icon} mcVersions={this.state.mod.mcVersions} />

                                <CurseDescLabel>Curse Description</CurseDescLabel>
                                <CurseDescription html={this.state.curseDesc} />
                            </Options>
                        </Loader>
                    </Content>
                </Main>
            </Page>
        )
    }
}

export default withRouter(ViewModPage);