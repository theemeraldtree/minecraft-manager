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

    componentDidUpdate(prevProps) {
        if(this.props.value !== prevProps.value) {
            this.setState({
                value: this.props.value
            })
        }
    }

    dropdownChange = (e) => {
        this.props.onChange(e.target.value, e);
        if(!this.props.value) {
            this.setState({
                value: e.target.value
            })
        }else{
            this.setState({
                value: this.props.value
            })
        }
    }

    render() {
        return (
            <Dropdown onChange={this.dropdownChange} value={this.state.value}>
                {this.state.items}
            </Dropdown>
        )
    }
}