import React, { Component } from 'react';
import styled from 'styled-components';
import WindowBar from './component/windowbar/windowbar';
import ErrorIcon from './img/error-icon.png';

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
  overflow-y: scroll;
  div {
    background: black;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    h1 {
      display: inline-block;
      margin-left: 10px;
    }
    img {
      display: inline-block;
      width: 100px;
    }
  }
  h4,
  h5,
  h6 {
    margin: 0;
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
      info,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <WindowBar />
          <BG>
            <div>
              <img src={ErrorIcon} />
              <h1>OH NO!</h1>
            </div>
            <h3>
              Something has gone{' '}
              <i>
                very, very, <b>very</b>
              </i>{' '}
              wrong!
            </h3>
            <h5>
              Try restarting Minecraft Manager. If this continues,{' '}
              <a href="https://theemeraldtree.net/mcm/issues">
                please file a bug report here.
              </a>
            </h5>
            <br />
            <h4>Detailed Error Info:</h4>
            <pre>
              <code>{this.state.error.toString()}</code>
            </pre>
            <pre>
              <code>{this.state.info.componentStack}</code>
            </pre>
          </BG>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
