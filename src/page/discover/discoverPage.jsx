import React, {Component} from 'react';
import Navbar from '../../component/navbar/navbar';
import WindowBar from '../../component/windowBar/windowBar';
import PageHeader from '../../component/pageheader/pageheader';
import DiscoverCurseCard from '../../component/cards/discovercurse/discovercursecard';
import Page, { Main, Content } from '../page';
class DiscoverPage extends Component {
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

    render() {
        return (
            <Page>
                <WindowBar />
                <Main>
                    <Navbar />
                    <Content>
                        <PageHeader showBackButton={false} title='Discover' />
                        <DiscoverCurseCard />
                    </Content>
                </Main>
            </Page>
        )
    }
}

export default DiscoverPage;