const ToastManager = {
    toasts: [],
    toastHandler: undefined,
    registerHandler(handler) {
        this.toastHandler = handler;
        this.updateHandler();
    },
    updateHandler() {
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
        console.log('New Toast');
        this.toasts.push({
            id: `toast-${title}-${new Date().getTime()}-${Math.random().toString(36).substring(6)}`,
            title: title,
            body: body
        })
        this.updateHandler();
    }
}

export default ToastManager;