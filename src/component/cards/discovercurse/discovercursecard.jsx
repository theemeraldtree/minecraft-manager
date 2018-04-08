import React, { Component } from 'react';
import curseForgeLogo from '../../../img/curseforge-logo.png'
import { withRouter } from 'react-router-dom';
import { Wrapper, ImgContainer, Img, Title, Desc } from '../genericCard';
class DiscoverCurseCard extends Component {
    click = () => {
        this.props.history.push('/discover/curseforge/{}')
    }

    render() {
        return (
            <Wrapper onClick={this.click}>
                <ImgContainer>
                    <Img src={curseForgeLogo} />
                </ImgContainer>
                <Title>CurseForge</Title>
                <Desc>CurseForge is now the largest repository for modded Minecraft featuring thousands of mods, texture packs and worlds. </Desc>
            </Wrapper>
        )
    }
}

export default withRouter(DiscoverCurseCard);