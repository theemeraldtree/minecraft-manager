import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
const Wrapper = styled.div`
    position: absolute;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 200;
    background-color: rgba(0, 0, 0, 0.5);
`
const PopupComponent = styled.div`
    width: 50vw;
    z-index: 400;
    >.title {
        font-size: 30pt;
        margin: 0;
        margin-top: 20px;
        text-align: center;
        font-weight: bolder;
        color: white;
    }
    >.desc {
        font-size: 20pt;
        text-align: center;
        color: white;
    }
    border-radius: 13px;
    background-color: #606060;
    >.action-buttons {
        text-align: center;
        margin: 0 auto;
        >* {
            margin-left: 10px;
            margin-right: 10px;
            display: inline-block;
        }
    }
    >.more-info-link {
        font-size: 20pt;
        display: block;
        padding-bottom: 10px;
        text-align: center;
        text-decoration: none;
        color: blue;
    }
`
const Popup = ({visible, className, children}) => {
    if(visible) {
        return (
            <Wrapper>
                <PopupComponent className={className ? className : ''}>
                    {children}
                </PopupComponent>
            </Wrapper>
        );
    }else{
        return (
            <div />
        )
    }
};

Popup.propTypes = {
    visible: PropTypes.bool
};

Popup.defaultProps = {
    visible: false
}

export default Popup;