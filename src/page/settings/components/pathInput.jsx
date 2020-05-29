import styled from 'styled-components';
import { TextInput } from '@theemeraldtree/emeraldui';

const PathInput = styled(TextInput)`
  && {
    width: calc(100% - 100px);
    font-size: 13pt;
    cursor: default;
    transition: 150ms;
  }

  &:disabled {
    filter: brightness(1) !important;
    opacity: 0.5 !important;
  }
`;

export default PathInput;
