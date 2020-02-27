import React, { Component } from 'react';
import styled from 'styled-components';
import Overlay from '../overlay/overlay';
import Button from '../button/button';
import AlertBackground from '../alert/alertbackground';

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
                <AlertBackground>
                    {this.props.questionText && <h1>{this.props.questionText}</h1>}
                    {this.props.children && this.props.children}
                    <DelButtons>
                        <Button onClick={cancelDelete} color='green'>{this.props.cancelText}</Button>
                        {!this.props.hideConfirm && <Button onClick={confirmDelete} color='red'>{this.props.confirmText}</Button>}
                    </DelButtons>
                </AlertBackground>
            </Overlay>
        )
    }
}

Confirmation.defaultProps = {
    cancelText: 'cancel',
    confirmText: 'confirm'
}