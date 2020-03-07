import React from 'react';
import os from 'os';

const SystemSpecs = () => (
  <pre>
    <code>
      Platform: {os.platform()}
      <br />
      Architecture: {os.arch()}
      <br />
      CPUS:
      <br />
      {os.cpus().map((cpu, index) => (
        <>
          CPU{index}: {cpu.model}
          <br />
        </>
      ))}
      <br />
      Free Memory: {os.freemem()}
      <br />
      Total Memory: {os.totalmem()}
      <br />
      Home Dir: {os.homedir()}
      <br />
      Hostname: {os.hostname()}
      <br />
    </code>
  </pre>
);

export default SystemSpecs;
