import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
const BG = styled.div`
    min-height: 60px;
    background-color: #262626;
    display: flex;
    align-items: center;
`

const Title = styled.p`
    color: white;
    margin: 0;
    margin-left: 10px;
    font-size: 32pt;
    font-weight: 100;
`

const Backlink = styled(Link)`
    color: white;
    font-weight: 900;
    text-decoration: none;
    font-size: 17pt;
    margin-left: 10px;
    margin-right: 12px;
    transition: 300ms;
    &:hover {
        opacity: 0.7;
    }
`

const Items = styled.div`
    display: flex;
    align-items: center;
    padding-right: 10px;
`

const Header = ({title, backlink, children}) => (
    <BG>
        {backlink && <Backlink to={backlink}>back</Backlink>}
        <Title>{title}</Title>
        <Items>
            {children}
        </Items>
    </BG>
)

export default Header;