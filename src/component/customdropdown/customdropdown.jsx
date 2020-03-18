import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import transition from 'styled-transition-group';
import arrow from './img/arrow.png';

const CDropdown = styled.div`
  background-color: #404040;
  color: white;
  width: 300px;
  height: 40px;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: 150ms;
  &:hover {
    background-color: #5b5b5b;
  }
  font-size: 12pt;
  outline: none;
  border: 0;
  ${props =>
    props.active &&
    `
        &:hover {
            background-color: #404040;
        }
    `}
  ${props =>
    props.disabled &&
    `
        cursor: not-allowed;
        background-color: #2e2e2e;
        &:hover {
            background-color: #2e2e2e;
        }
    `}

  &:focus-visible {
    outline: 2px solid yellow;
  }
`;

const Items = transition.div`
  position: absolute;
  height: auto;
  max-height: 300px;
  width: 100%;
  top: 40px;
  display: flex;
  flex-flow: column;
  z-index: 150;
  left: 0;
  overflow: hidden;
  &:enter {
      height: 0;
  }
  &:enter-active {
      height: 100vh;
      transition: height 350ms;
  }
  &:exit {
      height: 100vh;
  }
  &:exit-active {
      height: 0;
      transition: height 350ms;
  }

  & > .list {
    width: 100%;
    background-color: #4f4f4f;
    overflow-y: auto;

    &::-webkit-scrollbar-track {
      border: 0;
      border-radius: 0;
      background-color: #6e6e6e;
    }

    p {
      text-align: center;
    }
  }
`;

const Label = styled.p`
  margin: 0;
  margin-left: 10px;
`;

const Item = styled.button`
  cursor: pointer;
  padding-left: 10px;
  min-height: 25px;
  max-height: 65px;
  display: flex;
  align-items: center;
  transition: background 150ms;
  &:hover {
    background: #363636;
  }
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: white;
  font-size: 12pt;

  ${props =>
    props.active &&
    `
        background: #6e6e6e;
    `}

  &:focus-visible {
    outline: 2px solid yellow;
  }
`;

const Arrow = styled.img`
  position: absolute;
  right: 5px;
  width: 10px;
  transition: 150ms;
  ${props =>
    props.flip &&
    `
        transform: scaleY(-1);
    `}
`;

export default class CustomDropdown extends Component {
  constructor(props) {
    super(props);
    this.itemsRef = React.createRef();
    this.itemsListRef = React.createRef();
    this.wrapperRef = React.createRef();
    this.activeItemRef = React.createRef();
    this.state = {
      currentValue: '',
      items: []
    };
  }

  componentDidMount() {
    this.renderDropdown(true);
    document.addEventListener('mousedown', this.handleClick, false);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value || prevProps.items !== this.props.items) {
      this.renderDropdown(false);
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick, false);
  }

  dropdownChange = e => {
    this.props.onChange(e.target.value, e);
  };

  selectItem = e => {
    e.stopPropagation();
    const { value } = e.currentTarget.dataset;
    const { indexes } = this.state;
    const { onChange } = this.props;

    const oldValue = this.state.currentValue;
    const oldName = indexes[oldValue];
    if (onChange) {
      onChange(value, () => {
        this.setState({
          currentValue: oldValue,
          currentName: oldName
        });
      });
    }

    this.setState(
      {
        currentValue: value,
        currentName: indexes[value],
        dropdownOpen: false
      },
      () => {
        this.renderDropdown(false);
      }
    );
  };

  openDropdown = () => {
    if (!this.props.disabled) {
      if (!this.state.dropdownOpen && this.props.onOpen) {
        this.props.onOpen();
      }
      this.setState(
        prevState => ({
          dropdownOpen: !prevState.dropdownOpen
        }),
        () => {
          if (this.itemsListRef && this.activeItemRef.current) {
            this.itemsListRef.current.scrollTop = this.activeItemRef.current.offsetTop - 137;
          }

          if (this.state.dropdownOpen && this.props.onOpenComplete) {
            this.props.onOpenComplete();
          }
        }
      );
    }
  };

  clickAway = () => {
    this.setState({
      dropdownOpen: false
    });
  };

  handleClick = e => {
    if (this.wrapperRef.current && this.itemsRef.current) {
      if (!this.wrapperRef.current.contains(e.target) && !this.itemsRef.current.contains(e.target)) {
        this.clickAway();
      }
    }
  };

  renderDropdown(initial) {
    let currentValue, currentName;
    if (initial) {
      const firstItem = this.props.items[0];
      if (firstItem instanceof Object) {
        currentValue = firstItem.id;
        currentName = firstItem.name;
      } else {
        currentValue = firstItem;
        currentName = firstItem;
      }
    } else {
      currentValue = this.state.currentValue;
      currentName = this.state.currentName;
    }

    if (this.props.value) {
      currentValue = this.props.value;

      if (typeof this.props.items[0] === 'string') {
        if (!this.props.items.find(item => item === currentValue)) {
          currentValue = this.props.items[0];
          this.props.onChange(currentValue);
        }
      }
    }

    const indexes = {};

    const finalArr = this.props.items.map(item => {
      let id, name;
      if (item instanceof Object) {
        id = item.id;
        name = item.name;
      } else {
        id = item;
        name = item;
      }
      indexes[id] = name;
      if (currentValue === id) {
        return (
          <Item onClick={this.selectItem} active ref={this.activeItemRef} key={id} data-value={id}>
            {name}
          </Item>
        );
      }

      return (
        <Item onClick={this.selectItem} key={id} data-value={id}>
          {name}
        </Item>
      );
    });

    if (this.props.value && indexes[currentValue]) {
      currentName = indexes[currentValue];
    }

    if (initial && !this.props.value) {
      this.setState({
        items: finalArr,
        indexes
      });
    } else {
      this.setState({
        items: finalArr,
        currentValue,
        currentName,
        indexes
      });
    }
  }

  render() {
    const { dropdownOpen, currentName } = this.state;
    const { children, className } = this.props;
    return (
      <CDropdown
        ref={this.wrapperRef}
        role="button"
        tabIndex="0"
        className={className}
        onKeyDown={e => {
          if (e.keyCode === 13 || e.keyCode === 32) {
            this.openDropdown();
          }
        }}
        disabled={this.props.disabled}
        active={dropdownOpen}
        onClick={this.openDropdown}
      >
        <Label>{currentName}</Label>
        <Arrow flip={dropdownOpen} src={arrow} />
        {!this.props.disabled && (
          <Items timeout={350} in={dropdownOpen} unmountOnExit ref={this.itemsRef}>
            {children}
            <div ref={this.itemsListRef} className="list">
              {this.state.items.length >= 1 && this.state.items}
              {this.state.items.length === 0 && <p>There's nothing here!</p>}
            </div>
          </Items>
        )}
      </CDropdown>
    );
  }
}

CustomDropdown.propTypes = {
  onChange: PropTypes.func,
  items: PropTypes.array,
  value: PropTypes.any,
  disabled: PropTypes.bool,
  children: PropTypes.node,
  onOpen: PropTypes.func,
  onOpenComplete: PropTypes.func,
  className: PropTypes.string
};
