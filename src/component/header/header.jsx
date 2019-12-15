import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
const BG = styled.div`
    min-height: 60px;
    background-color: #2b2b2b;
    display: flex;
    align-items: center;
`

const Title = styled.p`
    color: white;
    margin: 0;
    margin-left: 10px;
    font-size: 32pt;
    font-weight: 300;
`

const BackButton = styled.div`
    color: white;
    font-weight: 900;
    text-decoration: none;
    font-size: 17pt;
    margin-left: 10px;
    margin-right: 12px;
    cursor: pointer;
    &:hover {
        filter: brightness(0.75);;
    }
    & a {
        text-decoration: none;
        color: white;
    }
`

const Items = styled.div`
    display: flex;
    align-items: center;
    padding-right: 10px;
`

const Header = ({title, backlink, backClick, children, showBackButton}) => (
    <BG>
        {showBackButton && <BackButton onClick={backClick ? backClick : window.history.back}>back</BackButton>}
        {backlink && <BackButton><Link to={backlink}>back</Link></BackButton>}
        <Title>{title}</Title>
        <Items>
            {children}
        </Items>
    </BG>
)

export default Header;