import React, { Component } from 'react';
import styled from 'styled-components';
import arrow from './img/arrow.png';
import ClickAwayListener from 'react-click-away-listener';
const CDropdown = styled.div`
    background-color: #404040;
    color: white;
    width: 300px;
    height: 40px;
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
    &:hover {
        background-color: #2e2e2e;
    }
`

const Items = styled.div`
    position: absolute;
    max-height: 200px;
    background-color: #4f4f4f;
    width: 300px;
    overflow-y: scroll;
    top: 40px;
    display: none;
    z-index: 20;
    ${props => props.visible && `
        display: block;
    `}
`;

const Label = styled.p`
    margin: 0;
    margin-left: 10px;
`;

const Item = styled.div`
    cursor: pointer;
    padding-left: 10px;
    height: 25px;
    display: flex;
    align-items: center;
    &:hover {
        background: #363636;
    }

    ${props => props.active && `
        background: #6e6e6e;
    `}
`

const Arrow = styled.img`
    position: absolute;
    right: 5px;
    width: 10px;
`;

export default class CustomDropdown extends Component {

    constructor(props) {
        super(props);
        this.itemsRef = React.createRef();
        this.state = {
            currentValue: '',
            items: [],
            scrollPos: 0
        }
    }

    componentDidMount() {
        this.renderDropdown(true);
    }

    renderDropdown(initial) {
        let currentValue, currentName;
        if(initial) {
            let firstItem = this.props.items[0];
            if(firstItem instanceof Object) {
                currentValue = firstItem.id;
                currentName = firstItem.name;
            }else{
                currentValue = firstItem;
                currentName = firstItem;
            }
        }else{
            currentValue = this.state.currentValue;
            currentName = this.state.currentName;
        }

        if(this.props.value) {
            currentValue = this.props.value;
        }

        let finalArr = [];
        let indexes = {};
        for(let item of this.props.items) {
            let id, name;
            if(item instanceof Object) {
                id = item.id;
                name = item.name;
            }else{
                id = item;
                name = item;
            }
            indexes[id] = name;
            finalArr.push(<Item onClick={this.selectItem} active={currentValue === id} key={id} data-value={id}>{name}</Item>)
        }

        if(this.props.value) {
            currentName = indexes[currentValue];
        }

        if(initial && !this.props.value) {
            this.setState({
                items: finalArr,
                currentValue: finalArr[0].props['data-value'],
                currentName: indexes[finalArr[0].props['data-value']],
                indexes: indexes
            })
        }else{
            this.setState({
                items: finalArr,
                currentValue: currentValue,
                currentName: currentName,
                indexes: indexes
            })
        }
   
    }

    componentDidUpdate(prevProps) {
        if(prevProps.value !== this.props.value || prevProps.items !== this.props.items) {
            this.renderDropdown(false);
        }
    }

    dropdownChange = (e) => {
        this.props.onChange(e.target.value, e);
        if(!this.props.value) {
            this.setState({
                value: e.target.value
            })
        }else{
            this.setState({
                value: this.props.value
            })
        }
    }

    openDropdown = () => {
        this.setState({
            dropdownOpen: !this.state.dropdownOpen
        }, () => {
            if(this.itemsRef) {
                this.itemsRef.current.scrollTop = this.state.scrollPos;
            }
        })
    }

    selectItem = (e) => {
        e.stopPropagation();
        const value = e.currentTarget.dataset.value;
        const { indexes } = this.state;
        const { onChange } = this.props;
        let scrollPos;
        if(this.itemsRef) {
            scrollPos = this.itemsRef.current.scrollTop
        }

        let oldValue = this.state.currentValue;
        let oldName = indexes[oldValue];
        if(onChange) {
            onChange(value, () => {
                this.setState({
                    currentValue: oldValue,
                    currentName: oldName
                });
            });
        }

        this.setState({
            currentValue: value,
            currentName: indexes[value],
            scrollPos: scrollPos,
            dropdownOpen: false
        }, () => {
            this.renderDropdown(false);
        });
    }

    clickAway = () => {
        this.setState({
            dropdownOpen: false
        })
    }

    render() {
        const { dropdownOpen, currentName } = this.state;
        return (
            <ClickAwayListener onClickAway={this.clickAway}>
                <CDropdown onClick={this.openDropdown}>
                    <Label>{currentName}</Label>
                    <Arrow src={arrow} />
                    <Items visible={dropdownOpen} ref={this.itemsRef}>
                        {this.state.items}
                    </Items>
                </CDropdown>
            </ClickAwayListener>
        )
    }
}