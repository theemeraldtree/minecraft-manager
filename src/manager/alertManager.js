const AlertManager = {
    alerts: [],
    alertHandler: undefined,
    registerHandler(handler) {
        this.alertHandler = handler;
        this.updateHandler();
    },
    updateHandler() {
        if(this.alertHandler) {
            this.alertHandler();
        }
    },
    dismissAlert(id) {
        for(let alert of this.alerts) {
            if(alert.id === id) {
                this.alerts.splice(this.alerts.indexOf(alert), 1);
            }
        }

        this.updateHandler();
    },
    alert(title, body, onConfirm, confirmText, cancelText) {
        let id = `alert-${title}-${new Date().getTime()}-${Math.random().toString(36).substring(6)}`;

        let confirm = 'confirm';
        if(confirmText) confirm = confirmText;

        let cancel = 'cancel';
        if(cancelText) cancel = cancelText;

        this.alerts.push({
            id,
            html: `
                <h1>${title}</h1>
                <p>${body}</p>
            `,
            buttons: [
                {
                    text: cancel,
                    onClick: () => AlertManager.dismissAlert(id),
                    color: 'red'
                },
                {
                    text: confirm,
                    onClick: () => {
                        AlertManager.dismissAlert(id);
                        onConfirm();
                    },
                    color: 'green'
                }
            ]
        });

        this.updateHandler();
    },
    messageBox(title, body) {
        let id = `${new Date().getTime()}-${title}`;

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
}

export default AlertManager;