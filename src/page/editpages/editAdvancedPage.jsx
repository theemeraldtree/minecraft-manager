import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import ProfileManager from '../../manager/profileManager';
import PageHeader from '../../component/pageheader/pageheader';
import Profile from '../../util/profile';
import WideButton from '../../component/button/widebutton/widebutton';
import EditBar from './component/editbar';
import Loader from '../../component/loader/loader';
import FileUtils from '../../util/fileUtils';
const { ipcRenderer } = require('electron');
const path = require('path');
import Page, { Main, Content } from '../page';
import EditContainer from './component/editcontainer';
import EditOptions from './component/editoptions';
import styled from 'styled-components';
const OpenFolder = styled.div`
    margin: 15px;
`
const OpenFolderButton = styled(WideButton)`
    width: 300px;
`
class EditAdvancedPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: new Profile(),
            loading: true,
            nameError: '',
            nameVal: '',
            nameTimeout: 0,
            nameIsTyping: false
        }
    }
    componentWillMount() {
        ProfileManager.loadProfiles().then(() => {
            let profile = ProfileManager.getProfileFromId(this.props.match.params.id);
            this.setState({
                profile: profile,
                loading: false
            });
        })
    }
    openFolder = () => {
        ipcRenderer.send('openFolder', path.join(FileUtils.getAppPath(), `/profiles/${this.state.profile.id}/files`))
    }
    render() {
        return (
            <Page>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader backURL={`/profiles/viewprofile/${this.state.profile.id}`} showBackButton title='Edit - Advanced' />
                        <EditContainer>
                            <EditBar profile={this.state.profile}/>
                            <Loader loading={this.state.loading}>
                                <EditOptions>
                                    <OpenFolder>
                                        <OpenFolderButton onClick={this.openFolder} className='open-folder' type='folder'>Open Folder</OpenFolderButton>
                                    </OpenFolder>
                                </EditOptions>
                            </Loader>
                        </EditContainer>
                    </Content>
                </Main>
            </Page>
        )
    }
}

export default withRouter(EditAdvancedPage);