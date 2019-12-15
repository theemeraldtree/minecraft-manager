import styled from 'styled-components';
const Dropdown = styled.select`
    background-color: #404040;
    outline: none;
    border: 0;
    color: white;
    padding: 10px;
    padding-left: 3px;
    font-size: 12pt;
    width: 220px;
    flex-shrink: 0;
    -webkit-user-select: none;
    -webkit-appearance: menulist-button;
    cursor: pointer;
    &:hover {
        filter: brightness(0.75);
    }
`
export default Dropdown;