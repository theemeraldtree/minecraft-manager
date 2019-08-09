import React from 'react';
import styled, { keyframes, css } from 'styled-components';
const slideIn = keyframes`
    0% {
        margin-bottom: -50px;
    }

    100% {
        margin-bottom: 7px;
    }
`

const slideOut = keyframes`
    0% {
        opacity: 1;
        margin-bottom: 7px;
    }

    100% {
        opacity: 0;
        margin-bottom: -70px;
    }
`

const BG = styled.div`
    width: fit-content;
    max-width: 350px;
    height: fit-content;
    min-height: 50px;
    background-color: #262626;
    z-index: 9999;
    box-shadow: 0px 0px 17px 0px rgba(0,0,0,0.75);
    color: white;
    padding: 10px;
    position: relative;
    pointer-events: auto;
    transition: 1s;
    margin-bottom: 7px;
    ${props => !props.disableAnimation && css`
        animation: ${slideIn} 0.3s ease;
    `}
    ${props => props.slideOut && css`
        animation: ${slideOut} 0.3s ease;
    `}
`
const Title = styled.p`
    font-weight: bolder;
    margin: 0;
`
const Body = styled.p`
    margin: 0;
`
const Dismiss = styled.p`
    position: absolute;
    top: 5px;
    right: 5px;
    margin: 0;
    cursor: pointer;
    color: #a1a1a1;
`
const ToastObject = ({id, title, body, dismiss, slideOut, disableAnimation}) => (
    <BG disableAnimation={disableAnimation} slideOut={slideOut}>
        <Title>{title}</Title>
        <Dismiss onClick={() => {dismiss(id)}}>close</Dismiss>
        <Body>{body}</Body>
    </BG>
)

export default ToastObject;