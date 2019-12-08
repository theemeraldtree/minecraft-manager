const ErrorManager = {
    makeReadable: (error) => {
        // node fs errors
        if(error.code) {
            switch(error.code) {
                case 'EBUSY':
                    return 'That file may be open in another application. Close it, and try again.';
                case 'EPERM':
                    return 'You are missing permissions to modify some files. Try running Minecraft Manager as the administrator.'
                default:
                    return error.toString();
            }
        }
    }
}

export default ErrorManager;