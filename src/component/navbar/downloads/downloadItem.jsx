import React from 'react';
import styled from 'styled-components';
import ProgressBar from '../../progressbar/progressbar';

const BG = styled.div`
    width: 100%;
    height: 70px;
    background-color: #484848;
    color: white;
    padding-top: 2px;
    padding-left: 5px;
    border-bottom: 2px solid #636363;
    position: relative;
`

const Title = styled.p`
    margin-top: 5px;
    margin-bottom: 0;
`

const Progress = styled.p`
    font-weight: 200;
    margin: 0;
`
const PBWrapper = styled.div`
    position: absolute;
    bottom: 2px;
    height: 5px;
    width: 100%;
    left: 0;
`
const DownloadItem = ({download}) => (
    <BG>
        <Title>{download.name}</Title>
        <Progress>{download.progress}</Progress>
        <PBWrapper>
            <ProgressBar progress={download.progressPercent} />
        </PBWrapper>
    </BG>
);

export default DownloadItem;