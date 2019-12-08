import React, { Component } from 'react';
import styled from 'styled-components';
import Overlay from '../overlay/overlay';
import Button from '../button/button';
import Hosts from '../../host/Hosts';
const BG = styled.div`
    width: 100%;
    height: fit-content;
    max-width: 600px;
    max-height: 500px;
    background-color: #444444;
    padding: 10px;
    color: white;
    display: flex;
    flex-flow: column;
`

const Title = styled.p`
    margin: 0;
    font-weight: 200;
    font-size: 21pt;
`

const Subtext = styled.p`
    margin: 0;
`

const Breaker = styled.div`
    height: 29px;
`

const ButtonsContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 5px;
    flex-shrink: 0;
    div {
        margin-right: 5px;
    }
`

export default class UpdateOverlay extends Component {

    constructor(props) {
        super(props);
        this.state = {
            displayState: 'main',
            exportProgress: 'Waiting...'
        }
    }

    enableFolder = (e) => {
        let { exportFolders } = this.state;
        exportFolders[e.currentTarget.dataset.folder] = !exportFolders[e.currentTarget.dataset.folder];
        this.setState({
            exportFolders: exportFolders
        })
    }
    
    async componentDidMount() {
        let { profile } = this.props;
        if(profile.hosts.curse) {
            const update = await Hosts.checkForAssetUpdates('curse', profile);
            if(update) {
                this.setState({
                    updateAvailable: true,
                    updateVersion: update
                })
            }else{
                this.setState({
                    noUpdates: true
                })
            }
        }else{
            this.setState({
                noUpdates: true
            })
        }
    }

    updateClick = () => {
        let { profile } = this.props;
        let { updateVersion } = this.state;
        this.setState({
            displayState: 'progress'
        })
        profile.changeCurseVersion(updateVersion.hosts.curse.fileID, (progress) => {
            this.setState({
                updateProgress: progress
            })
        }).then(() => {
            this.setState({
                displayState: 'done'
            })
        });
    }

    render() {
        const { noUpdates, updateAvailable, updateVersion, displayState } = this.state;
        return (
            <Overlay>
                <BG>
                    {displayState === 'done' && <>
                        <Title>done</Title>
                        <Subtext>the profile update is complete</Subtext>
                        <Button onClick={this.props.cancelClick} color='green'>ok</Button>
                        </>}
                    {displayState === 'main' && <>
                        {displayState !== 'done' && <Title>Update your profile</Title>}
                        {!noUpdates && !updateAvailable && <Subtext>Checking for updates...</Subtext>}
                        {noUpdates && <Subtext>You have the latest version. No update is available</Subtext>}
                        {updateAvailable && <Subtext>A new version is available. You have version {this.props.profile.version.displayName} and the latest version is {updateVersion.displayName}. Would you like to update?</Subtext>}
                        <Breaker />
                        <ButtonsContainer>
                            {updateAvailable && <>
                            <Button onClick={this.props.cancelClick} color='red'>cancel</Button>
                            <Button onClick={this.updateClick} color='green'>update</Button>
                            </>}
                            {noUpdates && <Button color='green' onClick={this.props.cancelClick}>close</Button>}
                        </ButtonsContainer>
                    </>}
                    {this.state.displayState === 'progress' && <>
                        <Title>Updating...</Title>
                        <Subtext>{this.state.updateProgress}</Subtext>
                    </>}
                </BG>
            </Overlay>
        )
    }
}
