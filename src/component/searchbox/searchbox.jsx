import styled from 'styled-components';
import { TextInput, withTheme } from '@theemeraldtree/emeraldui';

const SearchBox = styled(TextInput)`
  height: 40px;
  width: 100%;
  font-size: 17pt;
  margin-left: 10px;
  padding-left: 10px;
`;

export default withTheme(SearchBox);
