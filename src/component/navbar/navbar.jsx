import React, {Component} from 'react';
import Tooltip from '../tooltip/tooltip';
import { Wrapper, Logo, UpdateText, ProfilesButton, DiscoverButton, UpdateInfoWrapper, UpdateInfoTitle, UpdateInfoDesc, UpdateInfoButton } from './navbarcomponents';
const process = require('process');
const {ipcRenderer} = require('electron');
class Navbar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            updateText: '',
            updateModalVisible: false
        }
    }
    componentWillMount() {
        let dev = false;
        if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
          dev = true;
        }
        if(!dev) {
            ipcRenderer.on('checking-for-update', () => {
                this.setState({
                    updateText: 'Checking for updates...'
                });
            });
    
            ipcRenderer.on('update-available', () => {
                this.setState({
                    updateText: 'Downloading update...'
                });            
            })
    
            ipcRenderer.on('update-downloaded', () => {
                this.setState({
                    updateText: 'Update ready',
                    updateModalVisible: true
                }, () => {
                    setTimeout(() => {
                        this.setState({
                            updateText: ''
                        })
                    }, 3000);
                });            
            })
    
            ipcRenderer.on('update-not-available', () => {
                this.setState({
                    updateText: 'Update not available'
                });                
                setTimeout(() => {
                    this.setState({
                        updateText: ''
                    })            
                }, 1500)
            })
    
            ipcRenderer.on('error', () => {
                this.setState({
                    updateText: 'Error checking for updates'
                });                
                setTimeout(() => {
                    this.setState({
                        updateText: ''
                    })
                }, 4000);
            })
        }



    }
    installUpdate = () => {
        this.setState({
            updateModalVisible: false
        })
        ipcRenderer.send('installUpdate');
    }
    cancelUpdate = () => {
        this.setState({
            updateModalVisible: false
        })
    }
    render() {
        return (
            <Wrapper>
                <Logo />
                <ProfilesButton to='/profiles'>
                    <Tooltip align="right">Profiles</Tooltip>
                </ProfilesButton>
        
                <DiscoverButton to='/discover'>
                    <Tooltip align="right">Discover</Tooltip>
                </DiscoverButton>
        
                <UpdateText title={this.state.updateText} className='update-checker'>{this.state.updateText}</UpdateText>

                {this.state.updateModalVisible &&
                <UpdateInfoWrapper>
                    <UpdateInfoTitle>Minecraft Manager Update</UpdateInfoTitle>
                    <UpdateInfoDesc>A new update for Minecraft Manager is available. Would you like to install it by restarting?</UpdateInfoDesc>
                    <UpdateInfoButton onClick={this.installUpdate} type='color-green'>Restart</UpdateInfoButton>
                    <UpdateInfoButton onClick={this.cancelUpdate} type='color-red'>Later</UpdateInfoButton>
                </UpdateInfoWrapper>}
            </Wrapper>
        )
    }

}

export default Navbar;