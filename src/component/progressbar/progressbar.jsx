import React from 'react';
import styled from 'styled-components';
const Wrapper = styled.div`
    width: 100%;
    min-height: 5px;
    height: 100%;
    background-color: darkgray;
`
const Filler = styled.div`
    width: ${props => props.progress}%;
    height: 100%;
    background-color: green;
`
const ProgressBar = ({progress}) => (
    <Wrapper>
        <Filler progress={progress} />
    </Wrapper>
)

export default ProgressBar;