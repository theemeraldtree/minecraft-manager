import styled from 'styled-components';
const Overlay = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    left: 0;

    ${props => props.force && `
        z-index: 20;
    `}
`
export default Overlay;