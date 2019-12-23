import React, { Component } from 'react';
import DownloadsManager from '../../../manager/downloadsManager';
import styled, { keyframes, css } from 'styled-components';
import downloadsImg from './downloads.png';
import DownloadItem from './downloadItem';
const Wrapper = styled.div`
    width: 100px;
    height: 100px;
    display: flex;
    justify-content: center;
    position: absolute;
    bottom: 0;
    align-items: flex-end;
`
const DownloadsButton = styled.div`
    width: 50px;
    height: 50px;
    position: absolute;
    bottom: 23px;
    cursor: pointer;
    z-index: 999;
    background-image: url(${downloadsImg}); 
    background-size: contain;
    background-position-y: 7px;
    background-repeat: no-repeat;
    &:hover {
        filter: brightness(0.75);
    }
`

const Animation = keyframes`
    0% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
`

const AnimationBar = styled.div`
    width: 50px;
    height: 4px;
    background: grey;
    margin-bottom: 20px;
    ${props => props.active && css`
        background: linear-gradient(270deg, #0a993c, #0a993c, #0add53, #0a993c, #0a993c) !important;
        background-size: 600% 600% !important;
        animation: ${Animation} 1.5s ease infinite normal !important;
    `}
`
const DownloadsOverlay = styled.div`
    width: 350px;
    height: 350px;
    background-color: #1D1D1D;
    z-index: 9999;
    cursor: default;
    position: absolute;
    left: 120px;
    bottom: 20px;
    color: white;
    display: flex;
    flex-flow: column;
`
const Title = styled.p`
    font-size: 21pt;
    margin: 5px;
    font-weight: 200;
`

const List = styled.div`
    overflow-y: overlay;
    overflow-x: hidden;
    flex: 1 1 auto;
    box-sizing: content-box;
    width: 100%;
`
export default class Downloads extends Component {
    constructor() {
        super();
        this.state = {
            downloadsList: [],
            showOverlay: false
        }
    }

    componentDidMount() {
        if(localStorage.getItem('showDownloads') === 'true') {
            this.setState({
                showOverlay: true
            })
        }
        DownloadsManager.registerDownloadsViewer((downloads) => {
            let list = [];
            if(downloads.length >= 1) {
                for(let download of downloads) {
                    list.push(<DownloadItem key={download.name} download={download} />);
                    this.setState({
                        downloadsList: list
                    });
                }
            }else{
                this.setState({
                    downloadsList: []
                })
            }
        });
    }

    showDownloads = () => {
        localStorage.setItem('showDownloads', !this.state.showOverlay);
        this.setState({
            showOverlay: !this.state.showOverlay
        })
    }

    render() {
        return (
            <Wrapper>
                <DownloadsButton onClick={this.showDownloads} />
                <AnimationBar active={this.state.downloadsList.length} />
                {this.state.showOverlay && 
                <DownloadsOverlay>
                    <Title>downloads</Title>
                    <List>
                        {this.state.downloadsList}
                    </List>
                </DownloadsOverlay>}
            </Wrapper>
                
        )
    }
}