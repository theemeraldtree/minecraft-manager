import React from 'react';
import styled from 'styled-components';
const BG = styled.div`
    height: 60px;
    background-color: #262626;
    display: flex;
    align-items: center;
`

const Title = styled.p`
    color: white;
    margin: 0;
    margin-left: 10px;
    font-size: 32pt;
`
const Header = ({title}) => (
    <BG>
        <Title>{title}</Title>
    </BG>
)

export default Header;