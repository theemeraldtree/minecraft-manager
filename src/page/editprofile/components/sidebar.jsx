import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
const BG = styled.div`
    height: 100%;
    position: absolute;
    background-color: #505050;
    width: 120px;
`

const Item = styled(NavLink)`
    margin-top: 10px;
    width: 100%;
    display: block;
    height: 25px;
    text-align: center;
    color: white;
    text-decoration: none;
    font-size: 15pt;
    font-weight: 100;
    &.active {
        font-weight: bolder;
    }
    transition: 300ms;
    margin-bottom: 15px;
`
const Sidebar = ({profile}) => (
    <BG>
        <Item to={`/edit/general/${profile.id}`} activeClassName='active'>general</Item>
        <Item to={`/edit/versions/${profile.id}`}  activeClassName='active'>versions</Item>
        <Item to={`/edit/mods/${profile.id}`}  activeClassName='active'>mods</Item>
        <Item to={`/edit/advanced/${profile.id}`}  activeClassName='active'>advanced</Item>
    </BG>
)

export default Sidebar;