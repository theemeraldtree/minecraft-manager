import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import ProfileManager from '../../manager/profileManager';
import PageHeader from '../../component/pageheader/pageheader';
import Profile from '../../util/profile';
import EditBar from './component/editbar';
import Loader from '../../component/loader/loader';
import Page, { Main, Content } from '../page';
import EditOptions from './component/editoptions';
import EditContainer from './component/editcontainer';
import { ComingSoonTitle, ComingSoonText } from './component/comingsoon';
class EditMapsPage extends Component {
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
    searchChange = (e) => {
        this.setState({
            searchTerm: e.target.value
        })
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
    render() {
        return (
            <Page>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader backURL={`/profiles/viewprofile/${this.state.profile.id}`} showBackButton title='Edit - Resource Packs' />
                        <EditContainer>
                            <EditBar profile={this.state.profile}/>
                            <Loader loading={this.state.loading}>
                                <EditOptions>
                                    <ComingSoonTitle>Edit Maps</ComingSoonTitle>
                                    <ComingSoonText>Coming soon</ComingSoonText>
                                </EditOptions>
                            </Loader>
                        </EditContainer>
                    </Content>
                </Main>
            </Page>
        )
    }
}

export default withRouter(EditMapsPage);