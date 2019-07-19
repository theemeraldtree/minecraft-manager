import React, { Component } from 'react';
import styled from 'styled-components';
import WindowBar from '../component/windowbar/windowbar';
import Navbar from '../component/navbar/navbar';
import ImportOverlay from '../component/importoverlay/importoverlay';
import ProfilesManager from '../manager/profilesManager';
const app = require('electron').remote;
const BG = styled.div`
    background-color: #444444;
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-flow: column;
`

const Content = styled.div`
    flex: 1 1 auto;
    display: flex;
    position: relative;
    height: 100%;
    overflow-x: hidden;
`

const ContentSide = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-flow: column;
    overflow-x: hidden;
`

export default class Page extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hideOverlay: false
        }
    }

    importCancel = () => {
        localStorage.setItem('importDone', true);
        ProfilesManager.getProfiles().then(() => {
            this.setState({
                hideOverlay: true
            })
        })
    }

    render() {
        const { noNavbar, children } = this.props;
        return (
            <BG>
                <WindowBar />
                <Content>
                    {!noNavbar && <Navbar />}
                    {app.process.argv[1] !== '.' && app.process.argv[1] && !this.state.hideOverlay && localStorage.getItem('importDone') === 'false' && <ImportOverlay file={app.process.argv[1]} cancelClick={this.importCancel} />}
                    <ContentSide>
                        {children}
                    </ContentSide>
                </Content>
            </BG>
        )
    }
    
}