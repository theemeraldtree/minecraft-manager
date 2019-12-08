import styled from 'styled-components';
function getColor(name) {
    switch(name) {
        case 'purple':
            return '#911895';
        case 'green':
            return '#15950C';
        case 'yellow':
            return '#D4B107';
        case 'blue':
            return '#185F95';
        case 'red':
            return '#951818';
    }
}
const Button = styled.div.attrs(props => ({
    style: {
        backgroundColor: getColor(props.color)
    }
}))`
    padding: 11.5px;
    color: white;
    width: fit-content;
    display: inline-block;
    cursor: pointer;
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