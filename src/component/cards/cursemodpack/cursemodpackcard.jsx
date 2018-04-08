import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import CurseManager from '../../../manager/curseManager';
import Profile from '../../../util/profile';
import PropTypes from 'prop-types';
import Badge from '../../badge/badge';
import Data from '../../../util/data';
import ProfileManager from '../../../manager/profileManager';
import { Wrapper, Popup, PopupTitle, PopupDesc, PopupCloseButton, ImgContainer, Img, Title, Desc, Badges, Buttons, LoadingText, CustomButton } from '../genericCard';
class CurseModpackCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showError: false,
            errorText: '',
            loading: true,
            status: '',
            installed: false
        }
    }
    componentDidMount = () => {
        let profileManager = this.props.profileManager;
        this.setState({
            installed: profileManager.isCurseModpackInstalled(this.props.mod),
            loading: false
        })
    }
    install = (e) => {
        e.stopPropagation();
        this.setState({
            loading: true,
            status: 'Creating profile...'
        });
        let oldPack = this.props.mod;
        let profile = new Profile(Data.createId(oldPack.name));
        console.log(oldPack)
        profile.name = oldPack.name;
        profile.desc = oldPack.description;
        profile.mcVersion = oldPack.mcVersion;
        profile.type = 'curse';
        profile.curseID = oldPack.curseID;
        profile.icon = oldPack.icon;
        profile.isFTB = oldPack.isFTB;
        profile.mods = [];
        ProfileManager.createProfile(profile);
        CurseManager.getModpackLatestFile(profile).then((latestfile) => {
            CurseManager.installPackVersion(profile, latestfile.fileID, (upd) => {
                this.setState({
                    status: upd
                })
            }).then(() => {
                this.setState({
                    loading: false,
                    installed: true
                })
            })
        })

    }
    closePopupPress = (e) => {
        e.stopPropagation();
        this.setState({
            showError: false,
            errorText: 'Unknown error'
        })
    }
    delete = (e) => {
        e.stopPropagation();
        this.setState({
            loading: true,
            status: 'Deleting mod...'
        });
        this.props.profile.deleteMod(this.props.mod).then(() => {
            this.setState({
                loading: false
            })  
        });
    }
    cardClick = () => {
        this.props.cardClick(this.props.mod);
    }
    render() {
        let mod = this.props.mod;
        return (
            <Wrapper onClick={this.cardClick}>

                {this.state.showError && 
                    <Popup>
                        <PopupTitle>Error</PopupTitle>
                        <PopupDesc>{this.state.errorText}</PopupDesc>
                        <PopupCloseButton onClick={this.closePopupPress} className='close-button'>OK</PopupCloseButton>
                    </Popup>
                }
                <ImgContainer>
                    <Img src={mod.icon} className='img' />
                </ImgContainer>
                <Title>{mod.name}</Title>
                <Desc>{mod.description}</Desc>

                {this.state.installed && !this.state.loading &&
                    <Buttons>
                        <LoadingText>Installed</LoadingText>
                    </Buttons>
                }


                {!this.state.installed && !this.state.loading &&
                    <Buttons>
                        <CustomButton type='install' onClick={this.install} showTooltip tooltipAlign='bottom' tooltip='Install' />
                    </Buttons>
                }


                {this.state.loading &&
                    <Buttons>
                        <LoadingText>{this.state.status}</LoadingText>
                    </Buttons>
                }

                
                <Badges>
                    <Badge color='orange'><b>CURSE</b></Badge>
                </Badges>
            </Wrapper>
        )
    }

}

CurseModpackCard.propTypes = {
    profile: Profile,
    mod: PropTypes.object,
    cardClick: PropTypes.func,
    profileManager: PropTypes.instanceOf(ProfileManager)
}
export default withRouter(CurseModpackCard);