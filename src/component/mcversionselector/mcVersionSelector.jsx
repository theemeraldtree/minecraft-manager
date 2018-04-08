import React, {Component} from 'react';
import Dropdown from '../dropdown/dropdown';
import MinecraftVersionManager from '../../manager/minecraftVersionManager';
import PropTypes from 'prop-types'
export default class MCVersionSelector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            versions: [{value: 'Loading...', name: 'Loading...'}]
        }
    }
    componentDidMount() {
        var list = [];
        for(var i = 0; i < MinecraftVersionManager.getVersions().length; i++) {
            var ver = MinecraftVersionManager.getVersions()[i];

            if(i === 0) {
                list.push({value: ver, name: `${ver} (latest)`});                                
            }else{
                list.push({value: ver, name: ver});                                
            }
        }

        console.log(list);

        this.setState({
            list: list
        }, () => {
            console.log('state set');
        })
    }
    render() {  
        return <Dropdown list={this.state.list} onChange={this.props.onChange} value={this.props.value} defaultValue={this.props.defaultValue ? this.props.defaultValue : MinecraftVersionManager.getVersions()[0]} />    
    }

    
}

MCVersionSelector.propTypes = {
    onChange: PropTypes.func,
    defaultValue: PropTypes.string
}