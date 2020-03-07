import React from 'react';
import styled from 'styled-components';
import Button from '../button/button';
import {
  ContextMenu,
  ContextMenuTrigger,
  MenuItem,
  SubMenu,
} from 'react-contextmenu';
import { shell, clipboard } from 'electron';
const BG = styled.div`
  margin-top: 2px;
  width: 100%;
  height: 90px;
  background-color: #404040;
  display: inline-flex;
  user-select: none;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transition: transform 150ms;
  ${props =>
    !props.disableHover &&
    `
        cursor: pointer;
        &:hover {
            background-color: #5b5b5b;
            transform: scale(1.04);
        }
    `}
`;

const Image = styled.div.attrs(props => ({
  style: {
    backgroundImage: `url('${props.src}')`,
  },
}))`
  width: 90px;
  height: 90px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
`;

const Title = styled.p`
  color: white;
  font-weight: bolder;
  font-size: 18pt;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 5px 2px;
  margin-bottom: 0;
  user-select: none;
  display: inline-block;
  white-space: nowrap;
`;

const Version = styled.p`
  color: white;
  font-size: 11pt;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 5px;
  margin-top: 0;
  user-select: none;
  color: #dddbdd;
  ${props =>
    props.buttonShown &&
    `
        margin-right: 80px;
    `}
`;

const Buttons = styled.div`
  display: flex;
  flex-flow: row;
  right: 3px;
  bottom: 3px;
  position: absolute;
`;

const Details = styled.div`
  display: flex;
  justify-content: center;
  flex-flow: column;
  overflow: hidden;
  margin-left: 5px;
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
}) => (
  <>
    <ContextMenuTrigger holdToDisplay={-1} id={`assetcard${asset.id}`}>
      <BG
        disableHover={disableHover}
        data-cachedid={asset.cachedID}
        data-assetid={asset.id}
        onClick={onClick}
      >
        {asset.iconPath && (
          <Image
            src={`${asset.iconPath.substring(0, 1) === '/' ? 'file:///' : ''}${
              asset.iconPath
            }`}
          />
        )}
        <Details>
          <Title>{asset.name}</Title>
          <Version buttonShown={showInstall || showDelete}>
            {!showBlurb && asset.version && asset.version.displayName}
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
              delete
            </Button>
          )}

          {showInstall &&
            (installed || progressState.progress === 'installed') && (
              <Button disabled color="green">
                installed
              </Button>
            )}

          {showInstall && !installed && !progressState.progress && (
            <Button color="green" onClick={installClick}>
              install
            </Button>
          )}

          {showInstall &&
            !installed &&
            progressState.progress === 'notavailable' && (
              <Button color="green" disabled>
                not available
              </Button>
            )}

          {progressState.progress === 'installing' &&
            !installed &&
            showInstall && (
              <Button color="green" disabled>
                installing
              </Button>
            )}
        </Buttons>
      </BG>
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
        {showInstall && !installed && !progressState.progress && (
          <MenuItem onClick={installClick}>Install</MenuItem>
        )}
        {asset.hosts.curse && (
          <>
            <SubMenu hoverDelay={0} title="CurseForge">
              <MenuItem
                onClick={() =>
                  clipboard.writeText(
                    `${asset.name} on CurseForge:\n${asset.blurb}\nhttps://minecraft.curseforge.com/projects/${asset.hosts.curse.id}\n\nTry it with Minecraft Manager, the easiest way to manage Minecraft Mods and Modpacks (is.gd/mcmtet)`
                  )
                }
              >
                Copy with Info
              </MenuItem>
              <MenuItem
                onClick={() =>
                  shell.openExternal(
                    `https://minecraft.curseforge.com/projects/${asset.hosts.curse.id}`
                  )
                }
              >
                View
              </MenuItem>

              <MenuItem
                onClick={() =>
                  clipboard.writeText(
                    `https://minecraft.curseforge.com/projects/${asset.hosts.curse.id}`
                  )
                }
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

export default AssetCard;
