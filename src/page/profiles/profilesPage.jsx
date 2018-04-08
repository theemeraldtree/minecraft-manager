import React, {Component} from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import IconButton from '../../component/button/iconbutton/iconbutton';
import PageHeader from '../../component/pageheader/pageheader';
import ProfileView from '../../component/profileview/profileview';
import TextInput from '../../component/textinput/textinput';
import FileUtils from '../../util/fileUtils';
import Page, { Main, Content } from '../page';
import styled from 'styled-components';
//const app = require('electron').remote;
const AddButton = styled(IconButton)`
    top: 23px;
    left: 220px;
`
const SearchBoxInput = styled(TextInput)`
    float: right;
    margin-right: 40px;
`
const FileButton = styled(IconButton)`
    top: 23px;
    left: 230px;
`;
class ProfilesPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchTerm: ''
        }
    }
    searchChange = (e) => {
        this.setState({
            searchTerm: e.target.value
        })
    }

    createClick = () => {
        this.props.history.push(`/profiles/createprofile`);
    }

    importProfile = () => {
        this.props.history.push(`/profiles/import`);
    }
    render() {
        return (
            <Page>
                {!FileUtils.isSetup() && <Redirect to='/welcome' />}
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader showBackButton={false} title='Profiles'>
                            <AddButton type='add' onClick={this.createClick} showTooltip tooltipAlign='bottom' tooltip='Create new profile' />
                            <FileButton type='file' onClick={this.importProfile} showTooltip tooltipAlign='bottom' tooltip='Import profile' />
                            <SearchBoxInput onChange={this.searchChange} label='SEARCH' />
                        </PageHeader>
                        <ProfileView searchTerm={this.state.searchTerm}/>
                    </Content>
                </Main>
            </Page>
        )
    }
}

export default withRouter(ProfilesPage);