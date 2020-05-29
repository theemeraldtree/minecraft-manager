import styled from 'styled-components';
import { TextInput } from '@theemeraldtree/emeraldui';

const PathInput = styled(TextInput)`
  && {
    width: calc(100% - 100px);
    font-size: 13pt;
    cursor: default;
  }
`;

export default PathInput;
