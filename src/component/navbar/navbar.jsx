import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import Downloads from './downloads/downloads';
const BG = styled.div`
    width: 100px;
    min-width: 100px;
    height: 100%;
    background-color: #373737;
    flex: 0 1 auto;
`

const Link = styled(NavLink)`
    width: 100%;
    display: block;
    height: 30px;
    text-align: center;
    color: white;
    text-decoration: none;
    font-size: 15pt;
    font-weight: 100;
    &:hover {
        filter: brightness(0.75);
    }
    &.active, &.active:hover {
        filter: brightness(1.0);
        font-weight: 900;
    }
    margin-bottom: 15px;
`

const Links = styled.div`
    margin-top: 30px;
`

const Navbar = () => (
    <BG>
        <Links>
            <Link exact to='/' activeClassName='active'>profiles</Link>
            <Link to='/discover' activeClassName='active'>discover</Link>
        </Links>
        <Downloads />
    </BG>
)

export default Navbar;