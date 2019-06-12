import React from 'react';
import TextInput from '../textinput/textinput';
import styled from 'styled-components';
const Title = styled.p`
    margin: 0;
    position: absolute;
    bottom: 44px;
    width: 100%;
    color: white;
    font-weight: bolder;
`;
const Input = styled(TextInput)`
    max-width: 500px;
    width: 100%;
`
const Container = styled.div`
    position: relative;
    height: 100%;
    margin-top: 10px;
`
const TextInputLabelled = ({title, placeholder, value, onClick, onchange}) => (
    <Container>
        <Title>{title}</Title>
        <Input placeholder={placeholder} value={value} onClick={onClick} onchange={onchange} />
    </Container>
)

export default TextInputLabelled;