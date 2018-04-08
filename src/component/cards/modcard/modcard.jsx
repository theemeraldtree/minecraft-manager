import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Profile from '../../../util/profile';
import PropTypes from 'prop-types';
import Badge from '../../badge/badge';
import { Wrapper, Popup, PopupTitle, PopupDesc, PopupCloseButton, ImgContainer, Img, Title, Desc, Badges, Buttons, LoadingText, CustomButton } from '../genericCard';
class ModCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showError: false,
            errorText: '',
            loading: false,
            status: 'Error!'
        }
    }
    install = (e) => {
        e.stopPropagation();
        let profile = this.props.profile;
        if(profile.isModInstalled(this.props.mod)) {
            this.setState({
                loading: false,
                showError: false
            });
            return;
        }
        this.setState({
            loading: true,
            status: 'Checking versions...',
            showError: false,
            errorText: ''
        })
        profile.installMod(this.props.mod, (status) => {
            this.setState({
                status: `${status}...`
            })
        }).then(() => {
            this.setState({
                loading: false,
                showError: false
            })
        }).catch((err) => {
            if(err === 'no-mcversion') {
                this.setState({
                    showError: true,
                    loading: false,
                    status: 'Error!',
                    errorText: `There is no Minecraft ${profile.mcVersion} version of ${this.props.mod.name}!`
                })
            }
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
        let profile = this.props.profile;
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
                    <Img src={mod.icon} />
                </ImgContainer>
                <Title>{mod.name}</Title>
                <Desc>{mod.description}</Desc>

                {profile.isModInstalled(mod) && !this.state.loading &&
                    <Buttons>
                        <CustomButton type='delete' onClick={this.delete} showTooltip tooltipAlign='bottom' tooltip='Delete' />
                    </Buttons>
                }


                {!profile.isModInstalled(mod) && !this.state.loading &&
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

ModCard.propTypes = {
    profile: Profile,
    mod: PropTypes.object,
    cardClick: PropTypes.func
}
export default withRouter(ModCard);