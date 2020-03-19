import styled from 'styled-components';
import Button from '../button/button';

const HeaderButton = styled(Button)`
  background-color: #404040;
  border: 0;
  &:hover {
    filter: brightness(1);
    background-color: #5b5b5b;
    border-bottom: 2px solid #08b20b;
  }
  ${props =>
    props.active &&
    `
        border-bottom: 4px solid #08b20b;
        &:hover {
            border-bottom: 4px solid #08b20b !important;
        }
    `}
  ${props =>
    !props.active &&
    `
        border-bottom: 0px solid #08b20b;
    `}
  transition: border-bottom 150ms;
  margin-right: 3px;
  &:focus-visible {
    border-color: #08b20b;
    outline: 2px solid yellow;
  }
`;

export default HeaderButton;
