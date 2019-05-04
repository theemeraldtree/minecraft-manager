import styled from 'styled-components';
const Button = styled.div`
    padding: 11.5px;
    color: white;
    width: fit-content;
    display: inline-block;
    ${props => props.color === 'purple' && `
        background-color: #911895;
    `}
    ${props => props.color === 'green' && `
        background-color: #15950C;
    `}
    ${props => props.color === 'yellow' && `
        background-color: #D4B107;
    `}
    ${props => props.color === 'blue' && `
        background-color: #185F95;
    `}
    ${props => props.color === 'red' && `
        background-color: #951818;
    `}
    cursor: pointer;
    transition: 300ms;
    ${props => props.disabled && `
        filter: brightness(0.65);
    `}
    &:hover {
        ${props => !props.disabled && `
            filter: brightness(0.75);
        `}
        ${props => props.disabled && `
            cursor: not-allowed;
        `}
        
    }
`

export default Button;