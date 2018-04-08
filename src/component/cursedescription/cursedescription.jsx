import React from 'react';
import styled from 'styled-components';
const Wrapper = styled.div`
    margin-left: 65px;
    background-color: white;
    width: 70vw;
    border-radius: 13px;
    padding: 10px 10px 0 10px;
    flex: 1 1 auto;
    display: flex;
    flex-flow: column;
    margin-bottom: 30px;
`
const Content = styled.div`
    margin-left: 10px;
    width: 100%;
    height: 100%;
    overflow: scroll;
    hr {
        display: block;
        height: 1px;
        border: 0;
        border-top: 1px solid #F0F0F0;
        margin: 1em 0;
        padding: 0;
    }
    h2 {
        font-size: 18px;
    }
    p {
        margin-bottom: 12px;
        font-weight: normal;
        font-size: 13px;
    }
    ul {
        list-styled: square;
        padding-left: 30px;
        margin-bottom: 10px;
    }
    img {
        max-width: 100%;
        display: inline-block;
        height: inherit;
        vertical-align: middle;
    }
    iframe {
        border: 0;
    }
`
const CurseDescription = ({html}) => (
    <Wrapper>
        <Content dangerouslySetInnerHTML={{__html: html}} />
    </Wrapper>
)
export default CurseDescription;