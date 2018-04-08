import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import ModInfo from '../../component/modinfo/modinfo';
import PageHeader from '../../component/pageheader/pageheader';
import Loader from '../../component/loader/loader';
import Profile from '../../util/profile';
import CurseDescription from '../../component/cursedescription/cursedescription';
import CurseManager from '../../manager/curseManager';
import Page, { Options, Content, Main } from '../page';
import styled from 'styled-components';
const cheerio = require('cheerio');
const CurseDescLabel = styled.p`
    color: white;
    margin: 0;
    font-weight: bolder;
    margin-top: 30px;
    font-size: 20pt;
    margin-left: 70px;
`
class ViewCurseModpackPage extends Component {
    constructor(props) {
        super(props);
        console.log('view curse modpack page');
        this.state = {
            profile: new Profile(),
            loading: true,
            pack: {name: 'Loading', icon: '', mcVersions: ['Error']},
            curseDesc: '',
            searchTerm: ''
        };
    }
    componentWillMount = () => {

        let searchTerm = this.props.match.params.searchTerm;
        if(searchTerm != undefined) {
            this.setState({
                searchTerm: searchTerm
            })
        }

        console.log(this.props.match.params.modpack);
        CurseManager.getDetailedModInfo(this.props.match.params.modpack, true).then((mod) => {
            console.log(mod);
            this.setState({
                pack: mod,
                loading: false
            }, () => {
                this.processHTML();
            })
        })
    }
    processHTML = () => {
        let html = this.state.pack.curseDescription;
        let page = cheerio.load(html);
        page('a').addClass('browser-link');
        page('a').attr('target', '_blank');
        this.setState({
            curseDesc: page.html()
        })
    }
    render() {
        let pack = this.state.pack;
        if(!pack) {
            pack = {name: 'Loading', icon: '', mcVersions: ['Error']};
        }
        return (
            <Page>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <Loader loading={this.state.loading}>
                            <Options>
                                <PageHeader backURL={`/discover/curseforge/{"searchTerm": "${this.state.searchTerm}"}`} showBackButton title={`${this.state.pack.name}`} />

                                <ModInfo curseURL={pack.curseURL} name={pack.name} icon={pack.icon} mcVersions={pack.mcVersions} />

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

export default withRouter(ViewCurseModpackPage);