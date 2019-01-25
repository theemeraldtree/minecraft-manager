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
    ${props => props.color == 'yellow' && `
        background-color: #D4B107;
    `}
    cursor: pointer;
    transition: 300ms;
    &:hover {
        filter: brightness(0.75);
    }
`

export default Button;