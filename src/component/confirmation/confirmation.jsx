import React, { Component } from 'react';
import styled from 'styled-components';
import Overlay from '../overlay/overlay';
import Button from '../button/button';

const DelConfirm = styled.div`
    width: 100%;
    height: fit-content;
    max-width: 350px;
    max-height: 200px;
    margin: 10px;
    background-color: #444444;
    color: white;
    position: relative;
    padding: 10px;
    padding-bottom: 70px;
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
                    {this.props.questionText && <h1>{this.props.questionText}</h1>}
                    {this.props.children && this.props.children}
                    <DelButtons>
                        <Button onClick={cancelDelete} color='green'>{this.props.cancelText}</Button>
                        {!this.props.hideConfirm && <Button onClick={confirmDelete} color='red'>{this.props.confirmText}</Button>}
                    </DelButtons>
                </DelConfirm>
            </Overlay>
        )
    }
}

Confirmation.defaultProps = {
    cancelText: 'cancel',
    confirmText: 'confirm'
}