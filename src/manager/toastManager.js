const ToastManager = {
    toasts: [],
    toastHandler: undefined,
    registerHandler(handler) {
        console.log('registering handler!');
        console.log(handler);
        this.toastHandler = handler;
    },
    updateHandler() {
        console.log(this.toastHandler)
        if(this.toastHandler) {
            this.toastHandler();
        }
    },
    dissmisToast(id) {
        for(let toast of this.toasts) {
            if(toast.id === id) {
                this.toasts.splice(this.toasts.indexOf(toast), 1);
            }
        }
        this.updateHandler();
    },
    createToast(title, body) {
        console.log(this);
        this.toasts.push({
            id: `toast-${title}-${new Date().getTime()}`,
            title: title,
            body: body
        })
        this.updateHandler();
    }
}

export default ToastManager;