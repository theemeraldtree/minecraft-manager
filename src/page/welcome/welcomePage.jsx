import React, { Component } from 'react';
import WindowBar from '../../component/windowBar/windowBar';
import logoLarge from '../../img/logo.png';
import FileUtils from '../../util/fileUtils';
import { withRouter } from 'react-router-dom';
import TextInput from '../../component/textinput/textinput';
import Popup from '../../component/popup/popup';
import threeDotsImg from './image/threeDots.png';
import { settings as UserSettings } from '../../util/userSettings';
import WideButton from '../../component/button/widebutton/widebutton';
const os = require('os');
const path = require('path');
const fs = require('fs');
const { dialog } = require('electron').remote;
const { remote } = require('electron');
import styled from 'styled-components';
const Wrapper = styled.div`
    text-align: center;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    overflow-y: scroll;
`
const ContentWrapper = styled.div`
    margin-top: 30px;
    text-align: center;
`
const StyledWindowBar = styled(WindowBar)`
    position: fixed;
`
const Title = styled.p`
    margin: 0;
    color: white;
    text-align: center;
    font-weight: bolder;
    font-size: 40pt;
`
const Image = styled.img`
    margin-top: 20px;
    text-align: center;
    width: 250px;
    margin: 0 auto;
`
const Desc = styled.p`
    color: white;
    font-size: 20pt;
`
const SelectDirWrapper = styled.div`
    margin: 0 auto;
    position: relative;
    text-align: center;
`
const SelectDirTextInput = styled(TextInput)`
    margin: 0 auto;
    margin-left: 2px;
    display: inline-block;
    width: 80vw;
    margin-right: 20px;
    >input {
        border-radius: 9px 0px 0px 9px;
    }
`
const SelectDirButton = styled.div`
    display: inline-block;
    width: 50px;
    height: 45px;
    position: absolute;
    background-color: darkgray;
    border-radius: 0px 9px 9px 0px;
    background-image: url(${threeDotsImg});
    background-repeat: no-repeat;
    background-position: center;
    background-size: 40px 10px;
    cursor: pointer;
`
const InfoText = styled.p`
    color: #c9c9c9;
    >a {
        color: blue;
        text-decoration: none;
    }
`
const GoWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 50px;
    padding-bottom: 50px;
`
const GoButton = styled(WideButton)`
    >p {
        text-align: center;
        width: 100%;
        left: 0;
    }
`
export default withRouter(class WelcomePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: false,
            errorTitle: '',
            errorDesc: '',
            valInput: ''
        }
    }
    componentWillMount = () => {
        let dir;
        if(os.platform() === 'win32') {
            dir = path.join(remote.app.getPath('appData'), '/.minecraft'); 
        }else if(os.platform() === 'darwin') {
            dir = path.join(remote.app.getPath('appData'), '/minecraft');
        }
        this.setState({
            valInput: dir
        })
    }
    selectHome = () => {
        let files = dialog.showOpenDialog({title: 'Select Minecraft Home', buttonLabel: 'Set Home', properties: ['openDirectory']});
        if(fs.existsSync(files[0])) {
            this.setState({
                valInput: files[0]
            });
        }
    }
    inputChange = (e) => {
        this.setState({
            valInput: e.target.value
        })
    }
    dismissError = () => {
        this.setState({
            error: false,
            errorTitle: '',
            errorDesc: ''
        })
    }
    go = () => {
        if(!fs.existsSync(this.state.valInput)) {
            this.setState({
                error: true,
                errorTitle: 'Error',
                errorDesc: 'That path does not exist!'
            });
            return;
        }
        if(!fs.existsSync(FileUtils.getAppPath())) {
            fs.mkdirSync(FileUtils.getAppPath());
        }
        fs.writeFileSync(path.join(FileUtils.getAppPath(), `/options.json`), '{}');
        FileUtils.createDirIfNonexistent(path.join(FileUtils.getAppPath(), `/profiles`));
        FileUtils.createDirIfNonexistent(path.join(FileUtils.getAppPath(), `/resource`));
        FileUtils.createDirIfNonexistent(path.join(this.state.valInput, `/libraries/minecraftmanager`));
        FileUtils.createDirIfNonexistent(path.join(this.state.valInput, `/libraries/minecraftmanager/profiles`));
        FileUtils.copy(path.join(FileUtils.getResourcesPath(), `mcm-icon.png`), path.join(FileUtils.getAppPath(), `/resource/mcm-icon.png`));
        UserSettings.setOption('minecraftHome', this.state.valInput);
        UserSettings.setOption('ram', 2);
        this.props.history.push('/profiles');
    }
    render() {
        return (
            <Wrapper>
                <StyledWindowBar />
                <Popup visible={this.state.error}>
                    <p className='title'>{this.state.errorTitle}</p>
                    <p className='desc'>{this.state.errorDesc}</p>
                    <div className='action-buttons'>
                        <WideButton onClick={this.dismissError} type='color-green'>OK</WideButton>
                    </div>
                </Popup>
                <ContentWrapper>
                    <Image src={logoLarge} />
                    <Title>Welcome to Minecraft Manager!</Title>
                    <Desc>Let's get you setup. Where is your Minecraft home directory?</Desc>
                    <SelectDirWrapper>
                        <SelectDirTextInput onChange={this.inputChange} value={this.state.valInput} />
                        <SelectDirButton onClick={this.selectHome} />
                        <InfoText>Your Minecraft home directory is where your Minecraft game files are stored. Sometimes called the '.minecraft' folder. <a target='_blank' href='https://minecraft.gamepedia.com/.minecraft'>More info on the Minecraft Wiki</a></InfoText>
                    </SelectDirWrapper>

                    <GoWrapper>
                        <GoButton onClick={this.go} type='color-green'>Go!</GoButton>
                    </GoWrapper>
                </ContentWrapper>
            </Wrapper>
        )
    }
});