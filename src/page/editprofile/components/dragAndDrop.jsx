import React, { useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Container = styled.div`
  position: absolute;
  width: 100%;
  height: calc(100% - 110px);
  margin-top: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DragInfo = styled.div`
  background: rgba(0, 0, 0, 0.5);
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column;
  position: absolute;
  z-index: 10;
  h1 {
    margin: 0;
    font-size: 47pt;
  }
`;

const Children = styled.div`
  flex-flow: column;
  width: 100%;
  height: 100%;
`;

export default function DragAndDrop({ onDrop, children }) {
  const ref = React.createRef();
  const [currentlyDragging, setCurrentlyDragging] = useState(false);
  const [dragCounter, dispatchDragCounter] = useReducer((state, action) => {
    if (action === 'increment') return state + 1;
    if (action === 'decrement') return state - 1;
    if (action === 'reset') return 0;
    return state;
  }, 0);

  const dragEnter = e => {
    e.preventDefault();
    e.stopPropagation();
    dispatchDragCounter('increment');

    // Check if we are dropping a file
    const containsFile = [...e.dataTransfer.items].find(item => item.kind === 'file');

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0 && containsFile) {
      setCurrentlyDragging(true);
    }
  };

  const dragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    dispatchDragCounter('decrement');
    if (dragCounter === 1) setCurrentlyDragging(false);
  };

  const dragOver = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  const drop = e => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentlyDragging(false);
    onDrop([...e.dataTransfer.files]);
  };

  const reset = () => {
    dispatchDragCounter('reset');
    setCurrentlyDragging(false);
  };

  return (
    <Container onDragEnter={dragEnter} onMouseLeave={reset} onDragLeave={dragLeave} onDragOver={dragOver} onDrop={drop} ref={ref} active={currentlyDragging}>
      {currentlyDragging && (
      <DragInfo>
        <h1>+</h1>
        <h3>Drop files here...</h3>
      </DragInfo>
      )}
      <Children>
        {children}
      </Children>
    </Container>
  );
}

DragAndDrop.propTypes = {
  onDrop: PropTypes.func,
  children: PropTypes.node
};
