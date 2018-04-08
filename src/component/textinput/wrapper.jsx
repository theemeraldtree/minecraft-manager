import styled from 'styled-components';
const Wrapper = styled.div`
    position: relative;
    ${props => props.size === 'small' && `
        width: 35vw;
        max-width: 400px;
    `}

    ${props => props.size === 'wide' && `
        width: 37vw;
        max-width: 400px;
    `}

    ${props => props.size === 'large' && `
        width: 40vw;
        max-width: 500px;
    `}
`

export default Wrapper;
