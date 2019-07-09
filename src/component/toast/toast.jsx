import React, { Component } from 'react';
import styled from 'styled-components';
import ToastObject from './toastobject';
import ToastManager from '../../manager/toastManager'
const Container = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 99;
    pointer-events: none;
    overflow: hidden;
`
const List = styled.div`
    margin-bottom: 10px;
`
export default class Toast extends Component {
    constructor() {
        super();
        this.state = {
            list: [],
            dismissingToasts: [],
            existingToasts: []
        }
    }
    dismiss = (id) => {
        const copy = this.state.dismissingToasts.slice();
        copy.push(id);
        console.log(copy);
        this.setState({
            dismissingToasts: copy
        }, () => {
            this.renderToasts()
        });

        window.setTimeout(() => {
            ToastManager.dissmisToast(id);
        }, 290)
    }
    toastUpdate = () => {
        console.log('update called!');
        this.renderToasts();
    }
    renderToasts() {
        let list = [];
        let exist = this.state.existingToasts.slice()
        for(let toast of ToastManager.toasts) {
            console.log(this.state.dismissingToasts);
            console.log(toast.id);
            list.push(<ToastObject disableAnimation={exist.includes(toast.id)} slideOut={this.state.dismissingToasts.includes(toast.id)} dismiss={this.dismiss} id={toast.id} title={toast.title} body={toast.body} />);
            if(!exist.includes(toast.id)) {
                exist.push(toast.id);
            }
        }
        this.setState({
            list: list,
            existingToasts: exist
        })
    }
    componentDidMount() {
        ToastManager.registerHandler(this.toastUpdate);
    }
    render() {
        return (
            <Container>
                <List>
                    {this.state.list}
                </List>
            </Container>
        )
    }
}