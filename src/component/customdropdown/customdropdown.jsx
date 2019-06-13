import React, { Component } from 'react';
import Dropdown from '../dropdown/dropdown';
export default class CustomDropdown extends Component {

    constructor(props) {
        super(props);
        this.state = {
            items: []
        }
    }

    componentDidMount() {
        let finalArr = [];
        for(let item of this.props.items) {
            finalArr.push(<option key={item} value={item}>{item}</option>)
        }
        this.setState({
            items: finalArr,
            value: this.props.defaultValue
        })
    }

    dropdownChange = (e) => {
        this.props.onChange(e.target.value);
        this.setState({
            value: e.target.value
        })
    }

    render() {
        return (
            <Dropdown onChange={this.dropdownChange} value={this.state.value}>
                {this.state.items}
            </Dropdown>
        )
    }
}