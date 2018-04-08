import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Wrapper from './wrapper';

const Input = styled.input`
    width: 100%;
    height: 100%;
    background: #3f3f3f;
    border: 5px solid #363636;
    border-radius: 9px;
    appearance: none;
    outline: none;
    transition: 150ms;
    color: white;
    padding: 5px;
    &:focus {
        background: #777777;
        border-color: #5b5b5b;
    }
    ${props => props.size === 'small' && `
        height: 25px;
        font-size: 18pt;
    `}

    ${props => props.size === 'wide' && `
        height: 25px;
        font-size: 21pt;
    `}

    ${props => props.size === 'large' && `
        height: 20vh;
        max-height: 300px;
        resize: none;
        font-size: 21pt;
        vertical-align: text-top;
    `}
`

const Label = styled.p`
    color: white;
    margin: 0;
    margin-top: 5px;
    font-weight: bolder;
    font-size: 12pt;
`
const TextInput = ({label, defaultValue, value, onChange, className, size, children}) => (
    <Wrapper size={size} className={`${className ? className : ''}`}>
        <Label>{label}</Label>
        {value ? <Input size={size} value={value ? value : ''} defaultValue={defaultValue} onChange={onChange} />
                : <Input size={size} defaultValue={defaultValue} onChange={onChange} /> }
        {children}
    </Wrapper>
);

TextInput.propTypes = {
    label: PropTypes.string,
    type: PropTypes.string,
    onChange: PropTypes.func,
    defaultValue: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    value: PropTypes.string,
    step: PropTypes.string
};

TextInput.defaultProps = {
    size: 'wide'
}

export default TextInput;