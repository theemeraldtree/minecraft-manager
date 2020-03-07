import React, { Component } from 'react';
import PropTypes from 'prop-types';
import os from 'os';
import styled from 'styled-components';
import WindowBar from './component/windowbar/windowbar';
import ErrorIcon from './img/error-icon.png';
import MCMDataDump from './component/debug/mcmdatadump';

const Container = styled.div`
  overflow: hidden;
  display: flex;
  height: 100vh;
  flex-flow: column;
`;

const BG = styled.div`
  color: white;
  font-size: 21pt;
  font-weight: bolder;
  padding: 10px;
  overflow-y: auto;

  h1 {
    display: inline-block;
    color: gray;
    margin-left: 10px;
  }

  div {
    display: flex;
    align-items: center;
  }

  img {
    display: inline-block;
    width: 50px;
  }

  h3 {
    font-size: 16pt;
    margin-bottom: 5px;
  }

  h4,
  h5,
  h6 {
    margin: 0;
    font-size: 14pt;
    font-weight: 300;
  }

  h4 {
    color: white;
    font-size: 13pt;
    text-decoration: underline;
  }

  code {
    background: black;
    font-size: 8pt;
    font-weight: thin;
    font-family: monospace;
    user-select: text;
    margin: 0;
    line-height: 0;
  }

  pre {
    line-height: 13px;
    margin: 0;
    user-select: text;
    margin-bottom: 10px;
  }
`;

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    this.setState({
      hasError: true,
      error,
      info
    });
  }

  render() {
    const { hasError, error, info } = this.state;
    const { children } = this.props;

    const errorMessages = [':(', 'dang it!', 'whoops!', 'oh no!', 'something happened', 'well then...'];

    if (hasError) {
      return (
        <Container>
          {os.platform() !== 'linux' && <WindowBar />}
          <BG>
            <div>
              <img alt="Error" src={ErrorIcon} />
              <h1>{errorMessages[Math.floor(Math.random() * errorMessages.length)]}</h1>
            </div>
            <h3>Sorry, something hasn't gone right.</h3>
            <h5>
              Try restarting Minecraft Manager. If this continues,{' '}
              <a href="https://theemeraldtree.net/mcm/issues">please file a bug report here.</a>
            </h5>
            <br />
            <h4>Client-Side Error Info:</h4>
            <pre>
              <code>{error.toString()}</code>
            </pre>
            <pre>
              <code>{info.componentStack}</code>
            </pre>

            <h4>Minecraft Manager Data Dump:</h4>
            <MCMDataDump />
          </BG>
        </Container>
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;
