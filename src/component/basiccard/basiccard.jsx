import React from 'react';
import Card from '../card/card';
import PropTypes from 'prop-types';
import Colors from '../../style/colors';
import styled from 'styled-components';
const DescBox = styled.div`
    opacity: 0;
    transition: 150ms ease-in-out;
    position: absolute;
    margin: 0;
    left: 0;
    height: 120px;
    color: white;
    font-size: 10pt;
    visibility: hidden;
    z-index: 20;
    bottom: -100px;
    padding: 10px;
    width: 450px;
    white-space: normal;
    background-color: ${Colors.navbar};
    border-radius: 0px 0px 10px 10px;
`
const Wrapper = styled(Card)`
    width: 450px;
    height: 103px;
    transition: 150ms ease-in-out;
    margin: 10px;
    white-space: nowrap;
    position: relative;
    &:hover {
        transition: 300ms;
        border-radius: 10px 10px 0px 0px;
        box-shadow: 0px 0px 40px 8px rgba(0, 0, 0, 0.75);
    }
    &:hover ${DescBox} {
        position: absolute;
        visibility: visible;
        opacity: 1;
        bottom: -140px;
        display: inline-block;
        transition: 150ms ease-in-out;
        box-shadow: 0px 28px 40px 8px rgba(0, 0, 0, 0.75);
    }
`
const ImgWrapper = styled.div`
    width: 100px;
    position: absolute;
    display: block;
    height: 100px;
`
const ImgHolder = styled.div`
    width: 100%;
    height: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
`
const Img = styled.img`
    width: 100%;
    border-radius: 13px;
`
const Title = styled.p`
    position: absolute;
    margin: 0;
    bottom: 70px;
    left: 120px;
    color: white;
    font-size: 20pt;
    width: ${props => props.width ? props.width : '340px'};
    overflow-x: hidden;
    text-overflow: ellipsis;
`

const BasicCard = ({onClick, img, title, cursor, titleWidth, className, desc, children}) => (
    <Wrapper cursor={cursor ? cursor : null} hoverTitle={title} onClick={onClick} className={`basiccard ${className}`}>
        <ImgWrapper>
            <ImgHolder>
                <Img src={img} className='img' />
            </ImgHolder>
        </ImgWrapper>
        <Title title={title} width={titleWidth}>{title}</Title>
        <DescBox>
            <p className='desc'>{desc}</p>
        </DescBox>
        {children}
    </Wrapper>
);

BasicCard.propTypes = {
    img: PropTypes.string,
    title: PropTypes.string,
    desc: PropTypes.string,
    onClick: PropTypes.func
}
export default BasicCard;