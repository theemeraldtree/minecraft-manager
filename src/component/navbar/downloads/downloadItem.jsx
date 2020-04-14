import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ProgressBar from '../../progressbar/progressbar';

const BG = styled.div`
  width: 100%;
  height: 70px;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  padding-top: 2px;
  padding-left: 5px;
  position: relative;
`;

const Title = styled.p`
  margin-top: 5px;
  margin-bottom: 0;
`;

const Progress = styled.p`
  font-weight: 200;
  margin: 0;
`;
const PBWrapper = styled.div`
  position: absolute;
  bottom: 0;
  height: 5px;
  width: 100%;
  left: 0;
`;

export default function DownloadItem({ download }) {
  const split = download.name.split('\n');

  return (
    <BG>
      <Title>
        {download.name.split('\n')[0]}
        <br />

        {split.length === 2 && download.name.split('\n')[1].replace('_A_', '⮡      ')}
      </Title>
      <Progress>{download.progress}</Progress>
      <PBWrapper>
        <ProgressBar progress={download.progressPercent} />
      </PBWrapper>
    </BG>
  );
}

DownloadItem.propTypes = {
  download: PropTypes.shape({
    name: PropTypes.string,
    progressPercent: PropTypes.number,
    progress: PropTypes.string
  }).isRequired
};
