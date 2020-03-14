import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Button from '../button/button';
import AssetCard from '../assetcard/assetcard';
import SanitizedHTML from '../sanitizedhtml/sanitizedhtml';
import VersionCard from '../versioncard/versioncard';
import Detail from '../detail/detail';
import Global from '../../util/global';
import CustomDropdown from '../customdropdown/customdropdown';
import Hosts from '../../host/Hosts';
import ToastManager from '../../manager/toastManager';

const LoadingText = styled.div`
  font-size: 23pt;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: white;
  flex-flow: column;
`;

const Description = styled.div`
  overflow-y: scroll;
  background-color: #404040;
  margin-top: 3px;
  margin-bottom: 10px;
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const HeaderButtons = styled.div`
  min-height: 46px;
`;

const HB = styled(Button)`
  background-color: #404040;
  border: 0;
  &:hover {
    filter: brightness(1);
    background-color: #5b5b5b;
    border-bottom: 2px solid #08b20b;
  }
  ${props =>
    props.active &&
    `
        border-bottom: 4px solid #08b20b;
        &:hover {
            border-bottom: 4px solid #08b20b !important;
        }
    `}
  ${props =>
    !props.active &&
    `
        border-bottom: 0px solid #08b20b;
    `}
  transition: border-bottom 150ms;
  margin-right: 3px;
  &:focus-visible {
    border-color: #08b20b;
    outline: 2px solid yellow;
  }
`;

const List = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 10px;
  margin-bottom: 20px;
  height: calc(100% - 230px);
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const TryAgain = styled.p`
  margin: 0;
  color: lightblue;
  font-size: 14pt;
  cursor: pointer;
`;

export default class AssetInfo extends Component {
  constructor(props) {
    super(props);
    this.versionsListRef = React.createRef();
    this.state = {
      activeAsset: {
        name: 'Loading'
      },
      displayState: 'description',
      description: false
    };
  }

  static getDerivedStateFromProps(props) {
    return {
      activeAsset: props.asset
    };
  }

  componentDidMount() {
    if (!this.state.mcVerFilter) {
      this.setState({
        mcVerFilter: this.props.mcVerFilter
      });
    }
    this.showDescription();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.progressState !== this.props.progressState && this.state.displayState === 'versions') {
      this.showVersions();
    }
  }

  showDescription = async () => {
    const { host } = this.props;
    const { activeAsset } = this.state;
    if (activeAsset.hosts.curse) {
      const newAsset = await Hosts.addMissingInfo(host, 'description', activeAsset);
      if (newAsset.description) {
        this.setState({
          activeAsset: newAsset,
          description: true
        });
      } else {
        this.setState({
          description: false,
          cantConnect: true
        });
      }
    } else if (activeAsset.description) {
      this.setState({
        activeAsset,
        description: true
      });
    }
  };

  showDependencies = async () => {
    const { host } = this.props;
    const { activeAsset } = this.state;
    const newAsset = { ...activeAsset };
    this.setState({
      assetDependencies: [<LoadingText key="loading">loading...</LoadingText>]
    });

    const res = await Hosts.getDependencies(host, activeAsset);
    if (res) {
      newAsset.dependencies = res;

      let newDependList = [];
      if (res.length >= 1) {
        newDependList = res.map(asset => (
          <AssetCard progressState={{}} disableHover key={asset.id} showBlurb asset={asset} />
        ));
      } else {
        newDependList.push(<LoadingText key="none2">No Dependencies</LoadingText>);
      }

      this.setState({
        activeAsset: newAsset,
        assetDependencies: newDependList
      });
    } else {
      this.setState({
        cantConnect: true,
        assetDependencies: []
      });
    }
  };

  showVersions = async () => {
    const { activeAsset, mcVerFilter } = this.state;
    const { specificMCVer, allowVersionReinstallation, host } = this.props;
    if (activeAsset.hosts.curse) {
      this.setState({
        versions: [<LoadingText key="loading1">loading</LoadingText>]
      });
      const versions = await Hosts.getVersions(host, activeAsset);
      if (versions) {
        const final = versions.map(version => {
          if (version.minecraft.supportedVersions.includes(mcVerFilter) || mcVerFilter === 'All') {
            const ps = this.props.progressState;
            if (this.props.disableVersionInstall && ps.progress !== 'installing') {
              ps.progress = 'disable-install';
            }
            const forceVerFilter = this.props.forceVersionFilter && mcVerFilter !== this.props.mcVerFilter;
            return (
              <VersionCard
                allowVersionReinstallation={allowVersionReinstallation}
                badMCVer={specificMCVer ? !version.minecraft.supportedVersions.includes(specificMCVer) : false}
                key={version.displayName}
                progressState={ps}
                installClick={this.versionInstall}
                asset={activeAsset}
                host={host}
                disableMcVer={forceVerFilter}
                version={version}
                hideFramework={activeAsset.type !== 'mod'}
              />
            );
          }

          return <></>;
        });

        if (final.length === 0) {
          final.push(<LoadingText key="none1">no versions found</LoadingText>);
        }

        this.setState(
          {
            versions: final
          },
          () => {
            if (this.versionsListRef.current) {
              this.versionsListRef.current.scrollTop = this.state.scrollPosition;
            }
          }
        );
      } else {
        this.setState({
          cantConnect: true
        });
      }
    } else {
      this.setState({
        versions: [<LoadingText key="none2">no versions found, as this is a local file</LoadingText>]
      });
    }
  };

  versionInstall = e => {
    const version = Global.cached.versions[e.currentTarget.dataset.version];
    if (this.props.forceFramework) {
      if (version.hosts.curse) {
        if (version.hosts.curse.localValues && version.hosts.curse.localValues.inferredModloader) {
          if (version.hosts.curse.localValues.inferredModloader !== this.props.forceFramework) {
            ToastManager.createToast(
              'Uh oh',
              `It seems you're trying to install a version that's built for ${version.hosts.curse.localValues.inferredModloader}, not for ${this.props.forceFramework}`
            );
            return;
          }
        }
      }
    }
    this.setState({
      scrollPosition: this.versionsListRef.current.scrollTop
    });
    this.props.versionInstall(version, this.state.activeAsset);
  };

  displayStateSwitch = e => {
    const newState = e.currentTarget.dataset.state;

    this.setState({
      displayState: newState,
      cantConnect: false
    });

    if (newState === 'description') {
      this.showDescription();
    } else if (newState === 'dependencies') {
      this.showDependencies();
    } else if (newState === 'versions') {
      this.showVersions();
    }
  };

  mcVerChange = ver => {
    this.setState(
      {
        mcVerFilter: ver
      },
      () => {
        this.showVersions();
      }
    );
  };

  tryAgain = () => {
    this.displayStateSwitch({
      currentTarget: {
        dataset: {
          state: this.state.displayState
        }
      }
    });
  };

  render() {
    const { displayState, description, versions, activeAsset, assetDependencies, cantConnect } = this.state;
    const { type, installClick, localAsset, progressState } = this.props;
    return (
      <>
        <AssetCard
          progressState={progressState}
          installed={displayState[activeAsset.id] === 'installed'}
          disableHover
          showInstall={!localAsset}
          installClick={installClick}
          asset={activeAsset}
          showBlurb
        />
        <HeaderButtons>
          <HB active={displayState === 'description'} onClick={this.displayStateSwitch} data-state="description">
            Description
          </HB>
          {activeAsset.hosts.curse && (
            <HB active={displayState === 'versions'} onClick={this.displayStateSwitch} data-state="versions">
              Versions
            </HB>
          )}
          {activeAsset.hosts.curse && type === 'mod' && (
            <HB active={displayState === 'dependencies'} onClick={this.displayStateSwitch} data-state="dependencies">
              Dependencies
            </HB>
          )}
        </HeaderButtons>
        {displayState === 'description' && (
          <>
            {description && (
              <Description>
                <SanitizedHTML html={activeAsset.description} />
              </Description>
            )}
            {!description && !cantConnect && <LoadingText>loading...</LoadingText>}
          </>
        )}

        {cantConnect && (
          <LoadingText>
            can't connect
            <TryAgain onClick={this.tryAgain}>try again</TryAgain>
          </LoadingText>
        )}
        {displayState === 'versions' && (
          <>
            {!cantConnect && (
              <>
                <Detail>minecraft version</Detail>
                <CustomDropdown
                  value={this.state.mcVerFilter}
                  items={Global.getMCFilterOptions()}
                  onChange={this.mcVerChange}
                />
                {activeAsset.hosts.curse && (
                  <>
                    <List ref={this.versionsListRef}>{versions}</List>
                  </>
                )}
              </>
            )}
          </>
        )}

        {displayState === 'dependencies' && <List>{assetDependencies}</List>}
      </>
    );
  }
}

AssetInfo.propTypes = {
  asset: PropTypes.object,
  mcVerFilter: PropTypes.string,
  progressState: PropTypes.object,
  host: PropTypes.string,
  specificMCVer: PropTypes.string,
  allowVersionReinstallation: PropTypes.bool,
  disableVersionInstall: PropTypes.bool,
  forceVersionFilter: PropTypes.bool,
  versionInstall: PropTypes.func,
  forceFramework: PropTypes.bool,
  installClick: PropTypes.func,
  localAsset: PropTypes.bool,
  type: PropTypes.string
};
