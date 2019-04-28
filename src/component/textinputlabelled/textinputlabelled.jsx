import React from 'react';
import TextInput from '../textinput/textinput';
import styled from 'styled-components';
const Title = styled.p`
    margin: 0;
    position: absolute;
    bottom: 44px;
    width: 150px;
`;
const Container = styled.div`
    position: relative;
    height: 100%;
`
const TextInputLabelled = ({title, placeholder, value, onClick, onchange}) => (
    <Container>
        <Title>{title}</Title>
        <TextInput placeholder={placeholder} value={value} onClick={onClick} onchange={onchange} />
    </Container>
)

export default TextInputLabelled;