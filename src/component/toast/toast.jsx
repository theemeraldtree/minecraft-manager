import React, { PureComponent } from 'react';
import styled from 'styled-components';
import ToastObject from './toastobject';
import ToastManager from '../../manager/toastManager';
import NoticeToastObject from './noticeToastObject';

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
`;

const List = styled.div`
  margin-bottom: 10px;
`;

export default class Toast extends PureComponent {
  constructor() {
    super();
    this.state = {
      list: [],
      dismissingToasts: [],
      existingToasts: []
    };
  }

  componentDidMount() {
    ToastManager.registerHandler(this.toastUpdate);
  }

  dismiss = id => {
    const { dismissingToasts } = this.state;

    const copy = dismissingToasts.slice();
    copy.push(id);
    this.setState(
      {
        dismissingToasts: copy
      },
      () => {
        this.renderToasts();
      }
    );

    window.setTimeout(() => {
      ToastManager.dissmisToast(id);
    }, 290);
  };

  toastUpdate = () => {
    this.renderToasts();
  };

  renderToasts() {
    const { existingToasts, dismissingToasts } = this.state;
    const exist = existingToasts.filter(toast => toast.id.indexOf('notice-') === -1).map(toast => toast.id);
    const list = ToastManager.toasts.map(toast => {
      if (toast.id.indexOf('notice-') === -1) {
        return (
          <ToastObject
            key={`${toast.id}`}
            disableAnimation={exist.includes(toast.id)}
            slideOut={dismissingToasts.includes(toast.id)}
            dismiss={this.dismiss}
            id={toast.id}
            title={toast.title}
            body={toast.body}
            error={toast.error}
          />
        );
      }
      return <NoticeToastObject key={toast.id} text={toast.text} />;
    });

    this.setState({
      list,
      existingToasts: exist
    });
  }

  render() {
    return (
      <Container>
        <List>{this.state.list}</List>
      </Container>
    );
  }
}
