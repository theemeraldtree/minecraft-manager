let LogManager = {
    log: (severity, message) => {
        switch(severity) {
            case 'SEVERE':
                console.error(`[MCM-LOG] !! ERROR SEVERE !! ERROR READS: ${message}`);
                break;
            case 'ERROR':
                console.error(`[MCM-LOG] ! ERROR ${message}`);
                break;
            case 'WARN':
                console.warn(`[MCM-LOG] WARN ${message}`);
                break;
            case 'INFO':
                console.info(`[MCM-LOG] Info: ${message}`);
                break;
            default:
                console.error(`[MCM-LOG] !!! ERROR MISSING SEVERITY !!! ${message}`);
                break;
        }
    }
}

export default LogManager;