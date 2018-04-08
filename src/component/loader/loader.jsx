import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
const Wrapper = styled.div`
    width: 100%;
    height: 100%;
`
const LoaderLabel = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`
const LoadingText = styled.p`
    color: white;
    font-weight: bolder;
    font-size: 20pt;
`
const Loader = ({loading, children}) => (
    <Wrapper>
        {!loading && children}
        {loading && 
            <LoaderLabel>
                <LoadingText>LOADING</LoadingText>
            </LoaderLabel>}
    </Wrapper>
);

Loader.propTypes = {
    loading: PropTypes.bool
}

export default Loader;