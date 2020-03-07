const LogManager = {
  log: (severity, message) => {
    switch (severity.toUpperCase()) {
      case 'SEVERE':
        console.error(`!! ERROR SEVERE !! ${message}`);
        break;
      case 'ERROR':
        console.error(`! ERROR ${message}`);
        break;
      case 'WARN':
        console.warn(`WARN ${message}`);
        break;
      case 'INFO':
        console.info(message);
        break;
      default:
        console.error(`!!! ERROR MISSING SEVERITY !!! ${message}`);
        break;
    }
  }
};

export default LogManager;
