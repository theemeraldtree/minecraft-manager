import React from 'react';
import styled from 'styled-components';
import Sidebar from './sidebar';
const BG = styled.div`
    position: relative;
    flex: 1 1 auto;
    display: flex;
`
const CC = styled.div`
    margin-left: 130px;
    color: white;
    padding-top: 10px;
    overflow: scroll;
    flex: 1 1 auto;
`
const EditContainer = ({children, profile}) => (
    <BG>
        <Sidebar profile={profile} />
        <CC>
            {children}
        </CC>
    </BG>
)
export default EditContainer;