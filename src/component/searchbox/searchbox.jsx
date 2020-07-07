import styled from 'styled-components';
import { TextInput, withTheme } from '@theemeraldtree/emeraldui';

const SearchBox = styled(TextInput)`
  height: 30px;
  width: auto;
  font-size: 14pt;
  padding-left: 10px;
`;

export default withTheme(SearchBox);
