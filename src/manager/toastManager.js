const ToastManager = {
  toasts: [],
  toastHandler: undefined,
  registerHandler(handler) {
    this.toastHandler = handler;
    this.updateHandler();
  },
  updateHandler() {
    if (this.toastHandler) {
      this.toastHandler();
    }
  },
  dismissToast(id) {
    this.toasts.splice(
      this.toasts.find(toast => toast.id === id),
      1
    );
    this.updateHandler();
  },
  createToast(title, body, error) {
    this.toasts.push({
      id: `toast-${title}-${new Date().getTime()}-${Math.random()
        .toString(36)
        .substring(6)}`,
      title,
      body,
      error
    });
    this.updateHandler();
  },
  noticeToast(text) {
    this.toasts.push({
      id: `notice-${text}-${new Date().getTime()}-${Math.random()
        .toString(36)
        .substring(6)}`,
      text
    });
    this.updateHandler();
  }
};

export default ToastManager;
