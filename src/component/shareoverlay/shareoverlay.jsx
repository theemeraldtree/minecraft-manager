import React, { Component } from 'react';
import styled from 'styled-components';
import Overlay from '../overlay/overlay';
import Button from '../button/button';
import fs from 'fs';
import path from 'path';
const { dialog } = require('electron').remote;
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

const ExportList = styled.div`
    overflow-y: scroll;
    background-color: #404040;
    margin-top: 5px;
    height: min-content;
`

const ExportItem = styled.div`
    border-bottom: 2px solid #444444;
    display: flex;
    align-items: center;
    &:last-child {
        border: 0;
    }
`

const Checkbox = styled.input`
    width: 20px;
    height: 20px;
    display: inline-block;
`

const Label = styled.p`
    display: inline-block;
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

export default class ShareOverlay extends Component {

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
    
    componentDidMount() {
        let { profile } = this.props;
        let files = fs.readdirSync(profile.gameDir);
        if(files.length) {
            let exportFolders = [];
            let exportItems = [];


            files.forEach(file => {
                if(file !== 'mods') {
                    if(fs.lstatSync(path.join(profile.gameDir, file)).isDirectory()) {
                        exportFolders[file] = false;
                        exportItems.push(<ExportItem key={file}>
                            <Checkbox data-folder={file} onClick={this.enableFolder} type="checkbox" />
                            <Label>{file}</Label>
                        </ExportItem>)
                    }
                }else{
                    exportItems.unshift(<ExportItem key="mods">
                        <Checkbox type="checkbox" checked disabled />
                        <Label>mods</Label>
                    </ExportItem>)
                }
            })

            this.setState({
                exportFolders: exportFolders,
                exportItems: exportItems
            })
        }else{
            this.setState({
                noFolders: true
            })
        }
    }

    exportClick = () => {
        let { profile } = this.props;
        let { exportFolders } = this.state;
        let p = dialog.showSaveDialog({
            title: 'Where do you want to export to?',
            buttonLabel: 'Export here',
            defaultPath: `${profile.name}.mcjprofile`,
            filters: [
                {
                    name: 'Minecraft Java Profile',
                    extensions: ['mcjprofile']
                }
            ]
        });
        if(p) {
            profile.export(p, exportFolders, progress => {
                this.setState({
                    exportProgress: progress
                });
            }).then(() => {
                this.props.cancelClick();
            }).catch(() => {
                this.props.cancelClick();
            })
            this.setState({
                displayState: 'progress'
            })
        }
    }

    render() {
        return (
            <Overlay>
                <BG>
                    {this.state.displayState === 'main' && <>
                        <Title>Share your profile</Title>
                        <Subtext>Exporting your profile will export it to the <b>.mcjprofile</b> file format, which can be used in Minecraft Manager or other OMAF-supporting apps</Subtext>
                        <Breaker />
                        {
                            this.state.exportItems && <>
                                <Title>Choose your folders</Title>
                                <Subtext>Choose your folders that you'd like to include with your export. If you have mods installed, they are automatically included</Subtext>
                                <ExportList>
                                    {this.state.exportItems}
                                </ExportList>        
                            </>
                        }
                        <ButtonsContainer>
                            <Button onClick={this.props.cancelClick} color='red'>cancel</Button>
                            <Button onClick={this.exportClick} color='green'>export</Button>
                        </ButtonsContainer>
                    </>}
                    {this.state.displayState === 'progress' && <>
                        <Title>Exporting...</Title>
                        <Subtext>{this.state.exportProgress}</Subtext>
                    </>}
                </BG>
            </Overlay>
        )
    }
}
