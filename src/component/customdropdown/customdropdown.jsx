import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ClickAwayListener from 'react-click-away-listener';
import transition from 'styled-transition-group';
import arrow from './img/arrow.png';

const CDropdown = styled.div`
  background-color: #404040;
  color: white;
  width: 300px;
  height: 40px;
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
`;

const Items = transition.div`
    position: absolute;
    height: auto;
    max-height: 300px;
    background-color: #4f4f4f;
    width: 300px;
    overflow-y: scroll;
    top: 40px;
    display: block;
    z-index: 150;
    left: 0;
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
    &::-webkit-scrollbar-track {
        border: 0;
        border-radius: 0;
        background-color: #6e6e6e;
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
  transition: 150ms;
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
    this.state = {
      currentValue: '',
      items: [],
      scrollPos: 0
    };
  }

  componentDidMount() {
    this.renderDropdown(true);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value || prevProps.items !== this.props.items) {
      this.renderDropdown(false);
    }
  }

  clickAway = () => {
    this.setState({
      dropdownOpen: false
    });
  };

  selectItem = e => {
    e.stopPropagation();
    const { value } = e.currentTarget.dataset;
    const { indexes } = this.state;
    const { onChange } = this.props;
    let scrollPos;
    if (this.itemsRef) {
      scrollPos = this.itemsRef.current.scrollTop;
    }

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
        scrollPos,
        dropdownOpen: false
      },
      () => {
        this.renderDropdown(false);
      }
    );
  };

  openDropdown = () => {
    if (!this.props.disabled) {
      this.setState(
        prevState => ({
          dropdownOpen: !prevState.dropdownOpen
        }),
        () => {
          if (this.itemsRef) {
            this.itemsRef.current.scrollTop = this.state.scrollPos;
          }
        }
      );
    }
  };

  dropdownChange = e => {
    this.props.onChange(e.target.value, e);
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
      return (
        <Item onClick={this.selectItem} active={currentValue === id} key={id} data-value={id}>
          {name}
        </Item>
      );
    });

    if (this.props.value) {
      currentName = indexes[currentValue];
    }

    if (initial && !this.props.value) {
      this.setState({
        items: finalArr,
        currentValue: finalArr[0].props['data-value'],
        currentName: indexes[finalArr[0].props['data-value']],
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
    return (
      <ClickAwayListener onClickAway={this.clickAway}>
        <CDropdown role="button" disabled={this.props.disabled} active={dropdownOpen} onClick={this.openDropdown}>
          <Label>{currentName}</Label>
          <Arrow flip={dropdownOpen} src={arrow} />
          {!this.props.disabled && (
            <Items timeout={350} in={dropdownOpen} unmountOnExit ref={this.itemsRef}>
              {this.state.items}
            </Items>
          )}
        </CDropdown>
      </ClickAwayListener>
    );
  }
}

CustomDropdown.propTypes = {
  onChange: PropTypes.func,
  items: PropTypes.array,
  value: PropTypes.any,
  disabled: PropTypes.bool
};
