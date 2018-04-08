import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Wrapper from '../textinput/wrapper';
const Input = styled.textarea`
    background: #3f3f3f;
    border: 5px solid #363636;
    border-radius: 9px;
    appearance: none;
    outline: none;
    transition: 150ms;
    color: white;
    padding: 5px;
    font-size: 21pt;
    height: 20vh;
    max-height: 300px;
    resize: none;
    font-size: 21pt;
    vertical-align: text-top;
    width: 100%;
    margin: 0;
    &:focus {
        background: #777777;
        border-color: #5b5b5b;
    }
`
const Label = styled.p`
    color: white;
    margin: 0;
    font-weight: bolder;
    font-size: 12pt;
`
const TextArea = ({label, defaultValue, onChange, className, size, children}) => (
    <Wrapper size='large' className={`textinput size-${size} ${className}`}>
        <Label>{label}</Label>
        <Input defaultValue={defaultValue} type='text' onChange={onChange} />
        {children}
    </Wrapper>
);

TextArea.propTypes = {
    label: PropTypes.string,
    defaultValue: PropTypes.string,
    onChange: PropTypes.func,
    size: PropTypes.oneOf(['small', 'medium', 'large'])
};

TextArea.defaultProps = {
    size: 'large'
}

export default TextArea;