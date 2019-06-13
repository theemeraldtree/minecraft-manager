import React, { Component } from 'react';
import styled from 'styled-components';
import Page from '../../page';
import Header from '../../../component/header/header';
import ProfilesManager from '../../../manager/profilesManager';
import EditContainer from '../components/editcontainer';
import Dropdown from '../../../component/dropdown/dropdown';
import Detail from '../../../component/detail/detail';
import OptionBreak from '../components/optionbreak';
import InputContainer from '../components/inputcontainer';
import TextInput from '../../../component/textinput/textinput';
import Button from '../../../component/button/button';
import CustomDropdown from '../../../component/customdropdown/customdropdown';
import Global from '../../../util/global';
const CustomVersions = styled.div`
    background-color: #505050;
    width: 350px;
    padding: 10px;
`
export default class EditPageVersions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profile: {
                name: 'Loading'
            }
        }
    }

    static getDerivedStateFromProps(props) {
        return {
            profile: ProfilesManager.getProfileFromID(props.match.params.id)
        }
    }
    
    mcverChange = (version) => {
        this.state.profile.changeMCVersion(version);
    }

    render() {
        let { profile } = this.state;
        return (
            <Page>
                <Header title='edit profile' backlink={`/profile/${profile.id}`}/>
                <EditContainer profile={profile}>
                    <Detail>minecraft version</Detail>
                    <CustomDropdown onChange={this.mcverChange} items={Global.MC_VERSIONS} defaultValue={profile.minecraftversion} />
                    <OptionBreak />
                    <Detail>profile version</Detail>
                    <InputContainer>
                        <TextInput placeholder='Enter a version' />
                        <Button color='green'>change</Button>
                    </InputContainer>
                    <OptionBreak />
                    <Detail>custom versions</Detail>
                    <CustomVersions>
                        <Detail>forge</Detail>
                        <Dropdown>
                            <option>None</option>
                            <option>PLACEHOLDER</option>
                        </Dropdown>
                    </CustomVersions>
                </EditContainer>
            </Page>
        )   
    }

}