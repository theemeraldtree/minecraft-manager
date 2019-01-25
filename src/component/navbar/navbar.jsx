import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
const BG = styled.div`
    width: 100px;
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
    &.active {
        font-weight: bolder;
    }
    margin-bottom: 15px;
`

const Links = styled.div`
    margin-top: 30px;
`

const Navbar = () => (
    <BG>
        <Links>
            <Link to='/' activeClassName='active'>profiles</Link>
            <Link to='/discover' activeClassName='active'>discover</Link>
        </Links>
    </BG>
)

export default Navbar;