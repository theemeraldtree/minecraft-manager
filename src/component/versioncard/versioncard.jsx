import React, { Component } from 'react';
import styled from 'styled-components';
import Button from '../button/button';
import Detail from '../detail/detail';
import Curse from '../../host/curse/curse';
import SanitizedHTML from '../sanitizedhtml/sanitizedhtml';
const BG = styled.div`
    margin-top: 5px;
    width: 100%;
    height: 60px;
    display: flex;
    background-color: #717171;
    flex-flow: column;
    user-select: none;

    ${props => props.extraInfo && `
        height: 300px;
    `}
    transition: height 150ms ease;
    position: relative;
    overflow: hidden;
    padding-left: 5px;
`

const InfoSection = styled.div`
    margin-top: 20px;
    flex: 1 1 auto;
    position: relative;
    padding-bottom: 10px;
    padding-right: 10px;
`

const Title = styled.p`
    color: white;
    font-weight: bolder;
    font-size: 18pt;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 5px 2px;
    margin-bottom: 0;
    user-select: none;
    display: inline-block;
    white-space: nowrap;
`

const Details = styled.div`
    display: flex;
    justify-content: center;
    flex-flow: column;
    overflow: hidden;
    flex-shrink: 0;
`

const MoreInfo = styled.p`
    color: lightblue;
    margin: 0;
    cursor: pointer;
    position: absolute;
    bottom: 0;
    z-index: 2;
`

const Changelog = styled.div`
    height: 200px;
    overflow-y: scroll;
    width: 100%;
    background-color: #505050;
`

const ButtonContainer = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
`
export default class VersionCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showMoreInfo: false,
            changelog: 'loading...'
        }
    }

    toggleMoreInfo = async () => {
        this.setState({
            showMoreInfo: !this.state.showMoreInfo
        })

        const { version, asset } = this.props;
        if(version.hosts.curse) {
            if(this.state.changelog === 'loading...') {
                const changelog = await Curse.getFileChangelog(asset, version.hosts.curse.fileID);
                this.setState({
                    changelog: changelog
                })
            }
        }
    }

    render() {
        const { showMoreInfo, changelog } = this.state;
        const { version, progressState, disableMcVer, installClick } = this.props;

        let installed = this.props.installed;
        if(progressState === 'installed') {
            installed = false;
        }else if(progressState === 'force-not-installed') {
            installed = false;
        }else if(progressState === 'installed-done') {
            installed = true;
        }

        const freeToInstall = progressState !== 'installing' && progressState !== 'disable-install';
        return (
            <BG extraInfo={showMoreInfo}>
                <Details>
                    <Title>{version.displayName}</Title>
                </Details>
                <ButtonContainer>
                    {disableMcVer && !installed && !progressState && <Button disabled color='green'>wrong minecraft version</Button>}
                    {installed && !disableMcVer && progressState !== 'disable-install' && <Button disabled color='green'>installed</Button>}
                    {progressState === 'installing' && <Button disabled color='green'>installing</Button>}
                    {progressState === 'disable-install' && <Button disabled color='green'>install</Button>}
                    {!installed && !disableMcVer && freeToInstall && <Button data-version={version.cachedID} onClick={installClick} color='green'>install</Button>}
                </ButtonContainer>

                {!showMoreInfo && <MoreInfo onClick={this.toggleMoreInfo}>more info</MoreInfo>}
                <InfoSection>
                    <Detail>changelog</Detail>
                    <Changelog>
                        <SanitizedHTML small html={changelog} />
                    </Changelog>
                    {showMoreInfo && <MoreInfo onClick={this.toggleMoreInfo}>less info</MoreInfo>}
                </InfoSection>
            </BG>
        )
    }
}