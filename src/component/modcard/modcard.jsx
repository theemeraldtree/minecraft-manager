import React from 'react';
import styled from 'styled-components';
import Button from '../button/button';
const BG = styled.div`
    margin-top: 5px;
    width:100%;
    height: 100px;
    background-color: #717171;
    display: inline-flex;
    cursor: pointer;
    user-select: none;
    transition: 150ms;
    position: relative;
    &:hover {
        background-color: #5b5b5b;
    }
`

const Image = styled.div`
    background-image: url('${props =>  props.src}');
    width: 80px;
    height: 80px;
    background-size: contain;
    background-repeat: no-repeat;
    margin-top: 5px;
    background-position: center;
`

const Title = styled.p`
    color: white;
    font-weight: bolder;
    font-size: 22pt;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 5px 2px;
    margin-bottom: 0;
    user-select: none;
`

const Version = styled.p`
    color: white;
    font-weight: bolder;
    font-size: 13pt;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 5px;
    margin-top: 0;
    user-select: none;
`

const Buttons = styled.div`
    display: flex;
    flex-flow: row;
    right: 10px;
    bottom: 10px;
    position: absolute;
`

const Details = styled.div`
    height: 100px;
    display: flex;
    justify-content: center;
    flex-flow: column;
`

const ModCard = ({mod, onClick, showDelete, deleteClick}) => (
    <BG onClick={onClick}>
        <Image src={mod.iconpath} />
        <Details>
            <Title>{mod.name}</Title>
            <Version>versionname</Version>
        </Details>
        <Buttons>
            {showDelete && 
            <Button onClick={deleteClick} color='red'>delete</Button>
            }
        </Buttons>
    </BG>
)

export default ModCard;