import React, { useContext } from 'react';
import styled from 'styled-components';
import { Link, withRouter } from 'react-router-dom';
import transition from 'styled-transition-group';
import NavContext from '../../navContext';

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
    font-weight: 900;
    transition: 150ms;
`

const BackButton = transition.div`
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
    &:enter {
        margin-left: -35px
    }
    &:enter-active {
        margin-left: 10px;
        transition: 150ms;
    }
    &:exit {
        margin-left: 10px;
    }
    &:exit-active {
        margin-left: -35px;
        transition: 150ms;
    }
`

const Items = transition.div`
    display: flex;
    align-items: center;
    padding-right: 10px;
    opacity: 1;
    &:enter {
        position: relative;
        left: 50px;
        opacity: 0;
    }
    &:enter-active {
        position: relative;
        left: 0;
        opacity: 1;
        transition: 150ms;
    }
    &:exit {
        position: relative;
        opacity: 1;
    }
    &:exit-active {
        position: relative;
        left: 50px;
        opacity: 0;
        transition: 150ms;
    }
`

export default withRouter(function Header({ history }) {

    const context = useContext(NavContext);

    const { title, children, backLink, showBackButton, showChildren, onBackClick } = context.header;

    const click = () => {
        if(!backLink) {
            onBackClick ? onBackClick() : history.goBack();
        }
    }
    return (
        <BG>
            <BackButton 
                unmountOnExit
                in={showBackButton}
                timeout={150}
                onClick={click}
            >
                {!backLink && `←`}
                {backLink && <Link to={backLink}>←</Link>}
            </BackButton>
            <Title>{title}</Title>
            <Items
                unmountOnExit
                in={showChildren}
                timeout={150}
            >
                {children}
            </Items>
        </BG>
        )
});