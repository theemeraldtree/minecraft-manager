import React, { Component } from 'react';
import styled from 'styled-components';
import Overlay from '../overlay/overlay';
import Button from '../button/button';

const DelConfirm = styled.div`
    width: 100%;
    height: 100%;
    max-width: 350px;
    max-height: 100px;
    margin: 10px;
    background-color: #444444;
    color: white;
    position: relative;
    padding: 10px;
    h1 {
        margin: 0;
    }
`

const DelButtons = styled.div`
    position: absolute;
    bottom: 10px;
    right: 10px;
    div {
        margin: 2px;
    }
`

export default class Confirmation extends Component {
    render() {
        let { cancelDelete, confirmDelete } = this.props;
        return (
            <Overlay>
                <DelConfirm>
                    <h1>are you sure?</h1>
                    <DelButtons>
                        <Button onClick={cancelDelete} color='green'>cancel</Button>
                        <Button onClick={confirmDelete} color='red'>delete</Button>
                    </DelButtons>
                </DelConfirm>
            </Overlay>
        )
    }
}