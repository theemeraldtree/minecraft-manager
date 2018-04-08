import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import backIconImage from './img/back.png';
const Wrapper = styled.div`
    height: 90px;
    box-shadow: 0px 10px 24px 0px rgba(0, 0, 0, 0.55);
    z-index: 20;
    flex: 0 1 auto;
    position: relative;
`
const Title = styled.p`
    font-weight: bolder;
    color: white;
    font-size: 33pt;
    margin: 0;
    display: inline-block;
    position: absolute;
    top: 10px;
    left: 33px;
    user-select: none;
    ${props => props.backbutton && `
        left: 140px;
    `}
`
const Backbutton = styled(Link)`
    display: inline-block;
    margin: 28px 0px 28px 30px;
    text-decoration: none;
    transition: 300ms;
    &:hover {
        filter: brightness(0.5);
        transition: 300ms;
    }
    > * {
        display: inline-block;
    }
`
const Backtext = styled.p`
    color: white;
    font-weight: bolder;
    font-size: 18pt;
    margin: 0;
    bottom: 3px;
    left: 8px;
    position: relative;
`
const Backicon = styled.div`
    background-image: url(${backIconImage});
    width: 20px;
    height: 23px;
    background-size: cover;
`
const PageHeader = ({showTitle, title, showBackButton, backURL, children}) => (
    <Wrapper>
        {showBackButton && <Backbutton to={backURL} className='backbutton'>
                                <Backicon />
                                <Backtext>BACK</Backtext>
                           </Backbutton>}
        {showTitle && <Title backbutton={showBackButton}>{title}</Title>}

        {children}
    </Wrapper>
);

PageHeader.propTypes = {
    showTitle: PropTypes.bool,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    showSubtitle: PropTypes.bool,
    showBackButton: PropTypes.bool,
    backURL: PropTypes.string
};

PageHeader.defaultProps = {
    showTitle: true,
    title: 'Title',
    showBackButton: true,
    backURL: '/profiles',
    showSubtitle: false
};

export default PageHeader;