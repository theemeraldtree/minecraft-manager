import React, { Fragment } from 'react';
import IconButton from '../button/iconbutton/iconbutton'
import styled from 'styled-components';
const BaseButton = styled(IconButton)`
    position: absolute;
    margin: 10px;
    bottom: 5px;
`
const LaunchButton = BaseButton.extend`
    left: 115px;
`
const EditButton = BaseButton.extend`
    left: 160px;
`
const Buttons = ({launch, edit}) => (
    <Fragment>
        <LaunchButton type='launch' onClick={launch} />
        <EditButton type='edit' onClick={edit} />
    </Fragment>
)

export default Buttons;