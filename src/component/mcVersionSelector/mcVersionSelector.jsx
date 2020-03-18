import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { css } from 'styled-transition-group';
import CustomDropdown from '../customdropdown/customdropdown';
import Global from '../../util/global';
import TextInput from '../textinput/textinput';
import InputContainer from '../../page/editprofile/components/inputcontainer';
import Checkbox from '../checkbox/checkbox';

const Container = styled.div`
  padding-bottom: 5px;
  width: 100%;
  height: 100%;
  overflow: hidden;
  height: 27px;
  max-height: max-content;
  flex-shrink: 0;
  background: #404040;
  transition: 150ms;

  & > div:nth-child(1) {
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    width: 100%;
  }

  input[type='text'] {
    background: #6e6e6e;
    height: 25px;
    font-size: 13pt;
    width: 100%;
    max-width: 242px;
  }

  button {
    margin-left: 3px;
    background: #6e6e6e;
  }

  ${props =>
    props.open &&
    css`
      height: 300px;
    `}
`;

const OptionsButton = styled.button`
  margin: 0;
  border: 0;
  background: #404040;
  color: white;
  height: 27px;
  width: 27px;
  cursor: pointer;
`;

const Options = styled.div`
  width: 100%;
  max-width: 241px;
  cursor: default;
  margin-top: 10px;
  padding-left: 5px;

  p {
    margin: 0;
  }

  & > p {
    font-size: 11pt;
  }

  & > div {
    display: flex;
    flex-wrap: wrap;

    & > div {
      width: 120px;
      margin-top: 3px;
    }
  }
`;

export default function MCVersionSelector({ showAll, disabled, onChange, value, className }) {
  const [showOptions, setShowOptions] = useState(false);

  const inputRef = useRef(null);

  const getVisibilityOptions = () => {
    const found = Global.VERSIONS_RAW.find(ver => ver.id === value);
    const visibleOpt = {
      releases: true,
      preReleases: false,
      snapshots: false,
      old: false
    };

    if (found) {
      if (found.type !== 'release') {
        if (found.type === 'snapshot') {
          if (found.id.toLowerCase().indexOf('pre') === -1) {
            visibleOpt.snapshots = true;
          } else {
            visibleOpt.preReleases = true;
          }
        } else {
          visibleOpt.old = true;
        }
      }
    }

    return visibleOpt;
  };

  const filterVersions = visibleOpt => {
    let raw = Global.VERSIONS_RAW;

    raw = raw.filter(ver => {
      if (ver.type === 'release') {
        return visibleOpt.releases;
      }
      if (ver.type === 'snapshot') {
        if (ver.id.toLowerCase().indexOf('pre') === -1) {
          return visibleOpt.snapshots;
        }

        return visibleOpt.preReleases;
      }
      if (ver.type === 'old_alpha' || ver.type === 'old_beta') {
        return visibleOpt.old;
      }

      return true;
    });

    raw = raw.map(ver => ver.id);

    if (showAll) {
      raw.unshift('All');
    }

    return raw;
  };

  const [items, setItems] = useState(filterVersions(getVisibilityOptions()));
  const [visibilityOptions, setVisibilityOptions] = useState(getVisibilityOptions());

  const searchChange = e => {
    setItems(filterVersions(visibilityOptions).filter(ver => ver.indexOf(e.target.value) !== -1));
  };

  const showOptionsClick = e => {
    e.stopPropagation();
    setShowOptions(!showOptions);
  };

  const toggleOption = option => {
    const clone = { ...visibilityOptions };
    clone[option] = !clone[option];
    setVisibilityOptions(clone);
    setItems(filterVersions(clone));
  };

  const onOpen = () => {
    setItems(filterVersions(visibilityOptions));
  };

  const onOpenComplete = () => {
    inputRef.current.focus();
  };

  return (
    <CustomDropdown
      items={items}
      disabled={disabled}
      onChange={onChange}
      value={value}
      className={className}
      onOpen={onOpen}
      onOpenComplete={onOpenComplete}
    >
      <Container open={showOptions}>
        <div>
          <TextInput ref={inputRef} onClick={e => e.stopPropagation()} onChange={searchChange} placeholder="search" />
          <OptionsButton onClick={showOptionsClick}>☰</OptionsButton>
        </div>

        <Options onClick={e => e.stopPropagation()}>
          <p>show...</p>
          <div>
            <InputContainer>
              <Checkbox disabled checked />
              <p>Releases</p>
            </InputContainer>
            <InputContainer>
              <Checkbox onClick={() => toggleOption('preReleases')} checked={visibilityOptions.preReleases} />
              <p>Pre-Releases</p>
            </InputContainer>
            <InputContainer>
              <Checkbox onClick={() => toggleOption('snapshots')} checked={visibilityOptions.snapshots} />
              <p>Snapshots</p>
            </InputContainer>
            <InputContainer>
              <Checkbox onClick={() => toggleOption('old')} checked={visibilityOptions.old} />
              <p>Old Versions</p>
            </InputContainer>
          </div>
        </Options>
      </Container>
    </CustomDropdown>
  );
}

MCVersionSelector.propTypes = {
  showAll: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};
