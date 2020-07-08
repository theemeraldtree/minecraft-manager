import styled, { css } from 'styled-components';
import { TextInput, withTheme } from '@theemeraldtree/emeraldui';

const SearchBox = styled(TextInput)`
  height: 30px;
  width: auto;
  font-size: 14pt;
  padding-left: 10px;
  ${props => props.rounded && css`
    border-radius: 5px;
  `}
`;

export default withTheme(SearchBox);
