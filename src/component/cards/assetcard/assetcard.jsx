import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Profile from '../../../util/profile';
import PropTypes from 'prop-types';
import Badge from '../../badge/badge';
import { Wrapper, Popup, PopupTitle, PopupDesc, PopupCloseButton, ImgContainer, Img, Title, Desc, Badges, Buttons, LoadingText, CustomButton } from '../genericCard';
import MinecraftAsset from '../../../util/minecraftAsset';
import Mod from '../../../util/mod';
class AssetCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showError: false,
            errorText: '',
            loading: false,
            status: 'Error!'
        }
    }
    componentWillMount = () => {
        let profile = this.props.profile;
        let asset = this.props.asset;
        let type;
        if(asset instanceof Mod) {
            type = 'mod';
            if(!profile) {
                throw 'AssetCard of type Mod not given Profile!';
            }
        }
        this.setState({
            type: type
        });
    }

    isAssetInstalled = () => {
        let asset = this.props.asset;
        let type = this.state.type;
        if(type === 'mod') {
            return this.props.profile.isModInstalled(asset);
        }
    }

    add = (e) => {
        e.stopPropagation();
        let profile = this.props.profile;
        if(this.isAssetInstalled(this.props.asset)) {
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
        profile.installAsset(this.props.asset, (status) => {
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
                    errorText: `There is no Minecraft ${profile.mcVersion} version of ${this.props.asset.name}!`
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
            status: 'Deleting asset...'
        });
        this.props.profile.deleteasset(this.props.asset).then(() => {
            this.setState({
                loading: false
            })  
        });
    }
    cardClick = () => {
        this.props.cardClick(this.props.asset);
    }
    render() {
        let asset = this.props.asset;
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
                    <Img src={asset.iconpath} />
                </ImgContainer>
                <Title>{asset.name}</Title>
                <Desc>{asset.description}</Desc>

                {this.isAssetInstalled(asset) && !this.state.loading &&
                    <Buttons>
                        <CustomButton type='delete' onClick={this.delete} showTooltip tooltipAlign='bottom' tooltip='Delete' />
                    </Buttons>
                }


                {!this.isAssetInstalled(asset) && !this.state.loading &&
                    <Buttons>
                        <CustomButton type='add' onClick={this.add} showTooltip tooltipAlign='bottom' tooltip='Install' />
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

AssetCard.propTypes = {
    profile: Profile,
    asset: MinecraftAsset,
    cardClick: PropTypes.func
}
export default withRouter(AssetCard);