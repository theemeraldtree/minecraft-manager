import React from 'react';
import PropTypes from 'prop-types';
import styled, { css, keyframes } from 'styled-components';
import { ContextMenu, ContextMenuTrigger, MenuItem, SubMenu } from 'react-contextmenu';
import { shell, clipboard } from 'electron';
import { Button, Spinner } from '@theemeraldtree/emeraldui';
import Global from '../../util/global';
import downloadsIcon from '../navbar/downloads/downloads.png';
import ToastManager from '../../manager/toastManager';

const shrinkAnim = keyframes`
  0% {
    height: 70px;
  }

  100% {
    height: 0;
  }
`;

const Container = styled.div`
  margin-top: 4px;
  display: flex;
  width: 100%;
  height: 90px;
  outline: none;
  text-align: left;
  border: 0;
  padding: 0;
  background-color: #313131;
  user-select: none;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transition: 150ms;
  border-radius: 5px;
  ${props => !props.disableHover && css`
      cursor: pointer;
      &:hover {
        background-color: #414141;
      }
    `}
  &:focus-visible {
    outline: 2px solid yellow;
  }
  ${props =>
    props.compact &&
    css`
      height: 70px;

      &:hover {
        transform: scale(1);
      }
    `}
    ${props => props.shrink && css`
      animation: ${shrinkAnim} 100ms forwards;
    `}
`;

const Image = styled.div.attrs(props => ({
  style: {
    backgroundImage: `url('${props.src}')`
  }
}))`
  width: 85px;
  height: 85px;
  background-size: 85px;
  margin: 3px;
  border-radius: 5px;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;

  ${props =>
    props.compact &&
    css`
      height: 65px;
      width: 65px;
      background-size: 65px;
    `}
`;

const Title = styled.p`
  color: white;
  font-weight: bolder;
  font-size: 14pt;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 2px;
  margin-top: 4px;
  user-select: none;
  display: inline-block;
  white-space: nowrap;

  ${props =>
    props.compact &&
    css`
      font-size: 11pt;
    `}
`;

const Version = styled.p`
  font-size: 11pt;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 5px;
  margin-top: 0;
  margin-left: 2px;
  user-select: none;
  color: #dddbdd;
  white-space: pre-line;

  ${props =>
    props.buttonShown &&
    `
        margin-right: 80px;
    `}
`;

const Buttons = styled.div`
  display: flex;
  flex-flow: row;
  right: 10px;
  bottom: 10px;
  position: absolute;

  button {
    padding: 7px;
    font-size: 11pt;
    border-radius: 5px;
  }
`;

const Details = styled.div`
  display: flex;
  justify-content: center;
  flex-flow: column;
  overflow: hidden;
  margin-left: 5px;
`;

const ExtraInfo = styled.div`
  color: #dbdbdb;
  position: absolute;
  top: 10px;
  right: 10px;
  text-align: right;
  display: flex;
  align-items: center;
  border-radius: 3px;
  p {
    margin: 0;
    font-size: 9pt;
    margin-left: 2px;
    display: inline-block;
  }
  img {
    width: 15px;
    height: 15px;
    filter: brightness(0.85);
  }
`;

const AssetCard = ({
  asset,
  onClick,
  showDelete,
  progressState,
  showInstall,
  disableHover,
  installed,
  installClick,
  deleteClick,
  showBlurb,
  copyToClick,
  moveToClick,
  compact,
  shrink
}) => {
  const ref = React.createRef();
  return (
    <>
      <ContextMenuTrigger holdToDisplay={-1} id={`assetcard${asset.id}`}>
        <Container
          disableHover={disableHover}
          tabIndex={disableHover ? -1 : 0}
          data-cachedid={asset.cachedID}
          data-assetid={asset.id}
          onClick={onClick}
          onKeyDown={e => {
            if (e.keyCode === 13 || e.keyCode === 32) {
              onClick(e);
            }
          }}
          role="button"
          aria-pressed="false"
          compact={compact}
          ref={ref}
          shrink={shrink}
        >
          {asset.iconPath && (
            <Image
              src={`${asset.iconPath.substring(0, 1) === '/' ? 'file:///' : ''}${asset.iconPath}`}
              compact={compact}
            />
          )}
          <Details>
            {!installed && asset.hosts && asset.hosts.curse && (
              <ExtraInfo>
                <img alt="Downloads" src={downloadsIcon} />
                <p>{Global.abbreviateNumber(asset.hosts.curse.downloadCount)}</p>
              </ExtraInfo>
            )}
            <Title compact={compact}>{asset.name}</Title>
            <Version buttonShown={showInstall || showDelete}>
              {!showBlurb && asset.version && Global.cleanVersionName(asset.version.displayName, asset)}
              {showBlurb && asset.blurb}
            </Version>
          </Details>
          <Buttons>
            {showDelete && (
              <Button
                onClick={e => {
                  e.stopPropagation();
                  deleteClick(asset.id);
                }}
                color="red"
              >
                Delete
              </Button>
            )}

            {showInstall && (installed || progressState.progress === 'installed') && (
              <Button disabled color="#0e6f1e">
                Installed
              </Button>
            )}

            {showInstall && !installed && !progressState.progress && (
              <Button color="#0e6f1e" onClick={installClick}>
                Install
              </Button>
            )}

            {showInstall && !installed && progressState.progress === 'notavailable' && (
              <Button color="#0e6f1e" disabled>
                Not Available
              </Button>
            )}

            {progressState.progress === 'installing' && !installed && showInstall && (
              <Button color="#0e6f1e" disabled>
                <Spinner />
              </Button>
            )}
          </Buttons>
        </Container>
      </ContextMenuTrigger>
      <ContextMenu holdToDisplay={-1} id={`assetcard${asset.id}`}>
        <>
          {showDelete && (
            <MenuItem
              onClick={e => {
                e.stopPropagation();
                deleteClick(asset.id);
              }}
            >
              Delete
            </MenuItem>
          )}
          {installed && (
            <MenuItem
              disabled={asset.type === 'datapack'}
              onClick={e => {
                e.stopPropagation();
                copyToClick(asset.id);
              }}
            >
              Copy to...
            </MenuItem>
          )}
          {installed && (
            <MenuItem
              disabled={asset.type === 'datapack'}
              onClick={e => {
                e.stopPropagation();
                moveToClick(asset.id);
              }}
            >
              Move to...
            </MenuItem>
          )}
          {showInstall && !installed && !progressState.progress && <MenuItem onClick={installClick}>Install</MenuItem>}
          {showInstall && (installed || progressState.progress === 'installed') && (
            <MenuItem disabled>Installed</MenuItem>
          )}
          {asset.hosts && asset.hosts.curse && (
            <>
              <SubMenu hoverDelay={0} title="CurseForge">
                <MenuItem
                  onClick={() => {
                    clipboard.writeText(
                      `${asset.name} on CurseForge:\n${asset.blurb}\nhttps://minecraft.curseforge.com/projects/${asset.hosts.curse.id}`
                    );

                    ToastManager.noticeToast('Copied!');
                  }}
                >
                  Copy with Info
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    shell.openExternal(`https://minecraft.curseforge.com/projects/${asset.hosts.curse.id}`)
                  }
                >
                  View in Browser
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    clipboard.writeText(`https://minecraft.curseforge.com/projects/${asset.hosts.curse.id}`);

                    ToastManager.noticeToast('Copied!');
                  }}
                >
                  Copy Link
                </MenuItem>
              </SubMenu>
            </>
          )}
        </>
      </ContextMenu>
    </>
  );
};

AssetCard.propTypes = {
  asset: PropTypes.object,
  onClick: PropTypes.func,
  showDelete: PropTypes.bool,
  progressState: PropTypes.object,
  showInstall: PropTypes.bool,
  disableHover: PropTypes.bool,
  installed: PropTypes.bool,
  installClick: PropTypes.func,
  deleteClick: PropTypes.func,
  showBlurb: PropTypes.bool,
  copyToClick: PropTypes.func,
  moveToClick: PropTypes.func,
  compact: PropTypes.bool,
  shrink: PropTypes.bool
};

export default AssetCard;
