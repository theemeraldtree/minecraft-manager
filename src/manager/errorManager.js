const ErrorManager = {
  makeReadable: (error, circumstance) => {
    // node fs errors
    if (error.code) {
      switch (error.code) {
        case 'EBUSY':
          if (circumstance === 'subasset') {
            return 'Minecraft may currently be running. Close it, and try again';
          }
          return 'That file may be open in another application. Close it, and try again.';
        case 'EPERM':
          return `You are missing permissions to modify some files. Try running Minecraft Manager as the administrator. ${error.toString()}`;
        default:
          return error.toString();
      }
    }

    return error.toString();
  }
};

export default ErrorManager;
