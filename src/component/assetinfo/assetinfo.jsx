import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Spinner, Detail } from '@theemeraldtree/emeraldui';
import AssetCard from '../assetcard/assetcard';
import SanitizedHTML from '../sanitizedhtml/sanitizedhtml';
import VersionCard from '../versioncard/versioncard';
import Global from '../../util/global';
import Hosts from '../../host/Hosts';
import ToastManager from '../../manager/toastManager';
import SubAssetEditor from '../../page/editprofile/components/subAssetEditor';
import MCVersionSelector from '../mcVersionSelector/mcVersionSelector';
import HeaderButton from '../headerButton/headerButton';

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
  height: calc(100% - 136px);
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const HeaderButtons = styled.div`
  margin-top: 5px;
  min-height: 46px;
`;

const List = styled.div`
  flex: 1 1 auto;
  overflow-y: scroll;
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
  isMounted = true;

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

  componentWillUnmount() {
    this.isMounted = false;
  }

  showDescription = async () => {
    const { host } = this.props;
    const { activeAsset } = this.state;
    if (activeAsset.hosts.curse) {
      const newAsset = await Hosts.addMissingInfo(host, 'description', activeAsset);
      if (this.isMounted && newAsset.description) {
        this.setState({
          activeAsset: newAsset,
          description: true
        });
      } else if (this.isMounted) {
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
      assetDependencies: [
        <LoadingText key="loading">
          <Spinner />
        </LoadingText>
      ]
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
        versions: [
          <LoadingText key="loading1">
            <Spinner />
          </LoadingText>
        ]
      });
      const versions = await Hosts.getVersions(host, activeAsset);
      if (versions) {
        const final = versions
          .filter(version => {
            if (version.minecraft.supportedVersions.includes(mcVerFilter) || mcVerFilter === 'All') {
              return true;
            }
            return false;
          })
          .map(version => {
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
          });

        if (final.length === 0) {
          final.push(<LoadingText key="none1">No versions found</LoadingText>);
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
        versions: [<LoadingText key="none2">Mo versions found, as this is a local file</LoadingText>]
      });
    }
  };

  versionInstall = e => {
    const version = Global.cached.versions[e.currentTarget.dataset.version];
    if (this.state.activeAsset.type === 'mod') {
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
    }
    this.setState({
      scrollPosition: this.versionsListRef.current.scrollTop
    });
    this.props.versionInstall(version, this.state.activeAsset);
  };

  displayStateSwitch = newState => {
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
    const { type, installClick, localAsset, progressState, profileID } = this.props;

    return (
      <>
        <AssetCard
          progressState={progressState}
          installed={progressState[activeAsset.id] === 'installed'}
          disableHover
          showInstall={!localAsset}
          installClick={installClick}
          asset={activeAsset}
          showBlurb
        />
        <HeaderButtons>
          <HeaderButton active={displayState === 'description'} onClick={() => this.displayStateSwitch('description')}>
            Description
          </HeaderButton>
          {activeAsset.hosts.curse && (
            <HeaderButton active={displayState === 'versions'} onClick={() => this.displayStateSwitch('versions')}>
              Versions
            </HeaderButton>
          )}
          {activeAsset.hosts.curse && type === 'mod' && (
            <HeaderButton
              active={displayState === 'dependencies'}
              onClick={() => this.displayStateSwitch('dependencies')}
            >
              Dependencies
            </HeaderButton>
          )}
          {activeAsset.installed && type === 'world' && (
            <HeaderButton active={displayState === 'datapacks'} onClick={() => this.displayStateSwitch('datapacks')}>
              Datapacks
            </HeaderButton>
          )}
        </HeaderButtons>
        {displayState === 'description' && (
          <>
            {description && (
              <Description>
                <SanitizedHTML html={activeAsset.description} />
              </Description>
            )}
            {!description && !cantConnect && (
              <LoadingText>
                <Spinner />
              </LoadingText>
            )}
          </>
        )}

        {cantConnect && (
          <LoadingText>
            Can't connect
            <TryAgain onClick={this.tryAgain}>Try again</TryAgain>
          </LoadingText>
        )}
        {displayState === 'versions' && (
          <>
            {!cantConnect && (
              <>
                <Detail>Minecraft version</Detail>
                <MCVersionSelector showAll value={this.state.mcVerFilter} onChange={this.mcVerChange} />
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

        {displayState === 'datapacks' && (
          <>
            <SubAssetEditor id={profileID} assetType="datapack" dpWorld={activeAsset} />
          </>
        )}
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
  forceFramework: PropTypes.string,
  installClick: PropTypes.func,
  localAsset: PropTypes.bool,
  type: PropTypes.string,
  profileID: PropTypes.string
};
