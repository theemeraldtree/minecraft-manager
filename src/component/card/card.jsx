import styled from 'styled-components';
import Colors from '../../style/colors';
const Card = styled.div`
    background-color: ${Colors.card};
    border-radius: 10px;
    padding: 10px;
    margin-top: 20px;
    display: inline-block;
    cursor: ${props => props.cursor ? props.cursor : 'default'};
`

export default Card;