import styled from 'styled-components';

const TextBox = styled.textarea`
  background-color: #404040;
  border: 0;
  outline: none;
  color: white;
  height: 250px;
  font-size: 17pt;
  padding-left: 3px;
  resize: none;
  &::placeholder {
    color: white;
  }
  &:hover:not(:disabled),
  &:focus {
    filter: brightness(0.85);
  }
`;

export default TextBox;
