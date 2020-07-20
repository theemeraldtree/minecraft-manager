const AlertManager = {
  alerts: [],
  alertHandler: undefined,
  registerHandler(handler) {
    this.alertHandler = handler;
    this.updateHandler();
  },
  updateHandler() {
    if (this.alertHandler) {
      this.alertHandler();
    }
  },
  dismissAlert(id) {
    this.alerts.splice(
      this.alerts.find(alert => alert.id === id),
      1
    );

    this.updateHandler();
  },
  alert(title, body, onConfirm, confirmText, cancelText) {
    const id = `alert-${title}-${new Date().getTime()}-${Math.random()
      .toString(36)
      .substring(6)}`;

    let confirm = 'Confirm';
    if (confirmText) confirm = confirmText;

    let cancel = 'Cancel';
    if (cancelText) cancel = cancelText;

    this.alerts.push({
      id,
      html: `
                <h1>${title}</h1>
                <p>${body}</p>
            `,
      buttons: [
        {
          text: cancel,
          isCancel: true,
          onClick: () => AlertManager.dismissAlert(id),
          color: 'transparent'
        },
        {
          text: confirm,
          onClick: () => {
            AlertManager.dismissAlert(id);
            onConfirm();
          },
          color: '#444'
        }
      ]
    });

    this.updateHandler();
  },
  messageBox(title, body) {
    const id = `${new Date().getTime()}-${title}`;

    this.alerts.push({
      id,
      html: `
                <h1>${title}</h1>
                <p>${body}</p>
            `,
      buttons: [
        {
          text: 'close',
          onClick: () => AlertManager.dismissAlert(id),
          color: 'green'
        }
      ]
    });

    this.updateHandler();
  }
};

export default AlertManager;
