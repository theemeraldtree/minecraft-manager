import React, {Component} from 'react';
import Dropdown from '../dropdown/dropdown';
import MinecraftVersionManager from '../../manager/minecraftVersionManager';
import PropTypes from 'prop-types'
export default class ForgeVersionSelector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            versions: [{value: 'Loading...', name: 'Loading...'}],
            forgeVersions: ['Loading...']
        }
    }
    componentWillMount = () => {
        this.load(this.props);
    }
    load = (props) => {
        let list = [];
        MinecraftVersionManager.getForgeVersions(props.mcVersion).then((forgeVersions) => {
            for(var i = 0; i < forgeVersions.length; i++) {
                var ver = forgeVersions[i];
                
                console.log(ver);
                list[i] = {value: ver, name: ver};                
            }
    
            list.unshift({value: 'none', name: 'None'});
            console.log(list);
            this.setState({
                versions: list,
                forgeVersions: forgeVersions
            })
        })
    }
    componentWillReceiveProps = (props) => {
        this.load(props);
    }
    render() {  
        return <Dropdown list={this.state.versions} onChange={this.props.onChange} value={this.props.value} defaultValue={this.props.defaultValue ? this.props.defaultValue : this.state.forgeVersions[0]}>
            {this.state.versions}
        </Dropdown>
    }

    
}

ForgeVersionSelector.propTypes = {
    onChange: PropTypes.func,
    defaultValue: PropTypes.string,
    value: PropTypes.string,
    mcVersion: PropTypes.string
}