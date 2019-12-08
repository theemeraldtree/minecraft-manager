import React, { Component } from 'react';
import DownloadsManager from '../../../manager/downloadsManager';
import styled from 'styled-components';
import downloadsImg from './downloads.png';
import DownloadItem from './downloadItem';
const DownloadsButton = styled.div`
    width: 50px;
    height: 50px;
    position: absolute;
    bottom: 0;
    margin: 25px;
    cursor: pointer;
    z-index: 999;
    background-image: url(${downloadsImg}); 
    background-size: contain;
    &:hover {
        filter: brightness(0.75);
    }
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
            <>
                <DownloadsButton onClick={this.showDownloads} />
                {this.state.showOverlay && 
                <DownloadsOverlay>
                    <Title>downloads</Title>
                    <List>
                        {this.state.downloadsList}
                    </List>
                </DownloadsOverlay>}
            </>
                
        )
    }
}