import React, { PureComponent } from 'react';
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
    z-index: 99999;
    pointer-events: none;
    overflow: hidden;
`
const List = styled.div`
    margin-bottom: 10px;
`
export default class Toast extends PureComponent {
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
        this.renderToasts();
    }
    renderToasts() {
        let list = [];
        let exist = this.state.existingToasts.slice();
        for(let toast of ToastManager.toasts) {
            list.push(<ToastObject key={`${toast.id}`} disableAnimation={exist.includes(toast.id)} slideOut={this.state.dismissingToasts.includes(toast.id)} dismiss={this.dismiss} id={toast.id} title={toast.title} body={toast.body} error={toast.error} />);
            if(!exist.includes(toast.id)) {
                exist.push(toast.id);
            }
        }
        this.setState({
            list: list,
            existingToasts: exist
        });
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