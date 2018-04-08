import Colors from '../../style/colors';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import logo from './img/logo.png';
import profilesImage from './img/profiles.png';
import profilesImageActive from './img/profiles-selected.png';
import discoverImage from './img/discover.png';
import WideButton from '../button/widebutton/widebutton';
import discoverImageActive from './img/discover-selected.png';
const Wrapper = styled.div`
    width: 78px;
    flex: 0 0 auto;
    box-shadow: 10px 0px 28px 0px rgba(0, 0, 0, 0.55);
    z-index: 300;
    background: ${Colors.navbar};
`
const Logo = styled.div`
    background-image: url(${logo});
    width: 100%;
    height: 119px;
    margin: 0 auto;
    margin-top: 25px;
    background-position: center;
    display: inline-block;
    position: relative;
`
const NavbarButton = styled(NavLink)`
    width: 68px;
    height: 68px;
    display: block;
    margin: 0 auto;
    margin-top: 29px;
    background-size: cover;
`
const ProfilesButton = NavbarButton.extend`
    background-image: url(${profilesImage});
    &.active {
        background-image: url(${profilesImageActive});
    }
`

const DiscoverButton = NavbarButton.extend`
    background-image: url(${discoverImage});
    &.active {
        background-image: url(${discoverImageActive});
    }
`

const UpdateInfoWrapper = styled.div`
    position: absolute;
    bottom: 0;
    width: 100vw;
    padding-top: 20px;
    background: #8c8c8c;
    * {
        margin-left: 20px;
    }
`
const UpdateInfoTitle = styled.p`
    color: white;
    margin-top: 0;
    font-size: 15pt;
    margin-left: 20px;
    font-weight: bolder;
    margin-bottom: 0;
`
const UpdateInfoDesc = styled.p`
    margin-top: 0;
    font-size: 15pt;
    margin-left: 20px;
    font-weight: bolder;
    margin-bottom: 0;
    color: white;
`
const UpdateInfoButton = styled(WideButton)`
    display: inline-block;
`
const UpdateText = styled.p`
    color: white;
    position: absolute;
    bottom: 0;
    margin: 0;
    width: 76px;
    font-size: 10pt;
    font-style: italic;
    text-align: center;
`
export { Wrapper, UpdateText, Logo, ProfilesButton, DiscoverButton, UpdateInfoWrapper, UpdateInfoTitle, UpdateInfoDesc, UpdateInfoButton };