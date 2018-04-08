import React, {Component} from 'react';
import PropTypes from 'prop-types'
import styled from 'styled-components';

const Wrapper = styled.select`
    background: #3f3f3f;
    border: 5px solid #363636;
    border-radius: 9px;
    appearance: none;
    outline: none;
    width: 200px;
    transition: 150ms;
    color: white;
    padding: 5px;
    font-size: 16pt;
    display: block;
    &:active, &:focus {
        transition: 150ms;
        background: #777777;
        border-color: #5b5b4b;
        border-radius: 0 0 0 0;
    }
    > option {
        outline: none;
        border: 0;
        background-color: #363636;
    }
`
export default class Dropdown extends Component {
    constructor(props) {
        super(props);
        this.state = {
            list: []
        }
    }
    componentWillReceiveProps(props) {

        let out = [];
        console.log("PROPS HAVE BEEN RECEIVED");
        console.log(props.list);
        let list = props.list;
        if(list.length > 0) {
            console.log('list');
            for(let obj of list) {
                out.push(<option value={obj['value']}>{obj['name']}</option>);
            }    
        }

        this.setState({
            list: out
        })
    }
    render() {
        let className = this.props.className;  
        return <Wrapper onChange={this.props.onChange} value={this.props.value} className={className ? className : null} defaultValue={this.props.defaultValue ? this.props.defaultValue : ''}>
            {this.state.list}
        </Wrapper>
    }

    
}

Dropdown.propTypes = {
    onChange: PropTypes.func,
    list: PropTypes.array,
    defaultValue: PropTypes.string
}