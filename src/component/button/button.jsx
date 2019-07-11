import styled from 'styled-components';
function getColor(name) {
    if(name === 'purple') {
        return '#911895';
    }else if(name === 'green') {
        return '#15950C'
    }else if(name === 'yellow') {
        return '#D4B107'
    }else if(name === 'blue') {
        return '#185F95';
    }else if(name === 'red') {
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