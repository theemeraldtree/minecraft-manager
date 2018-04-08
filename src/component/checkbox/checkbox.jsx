import React, { Component } from 'react';
import styled from 'styled-components';
import uniqid from 'uniqid';
const Wrapper = styled.div`
    width: 100%;
    height: 45px;
    background-color: #bcbcbc;
    border: 2px solid #8e8e8e;
    box-sizing: border-box;
    position: relative;
    cursor: pointer;
`
const Input = styled.input`
    height: 25px;
    outline: none;
    background-color: white;
    width: 40px;
    position: absolute;
    top: 5px;
    left: 10px;
`
const Label = styled.p`
    margin: 0;
    display: inline-block;
    font-size: 12pt;
    font-weight: bolder;
    position: absolute;
    top: 9px;
    left: 55px;
`
export default class Checkbox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            id: ''
        }
    }
    componentWillMount() {
        this.setState({
            id: `form-${uniqid()}`
        })
    }
    render() {
        let { onChange, label } = this.props;
        let id = this.state.id;
        return (
            <label for={id}>
                <Wrapper>
                    <Input data-label={label} name={id} id={id} type='checkbox' onChange={onChange} />
                    <Label>{label}</Label>
                </Wrapper>
            </label>
        )
    }
}

