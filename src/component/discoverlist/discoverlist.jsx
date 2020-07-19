import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Dropdown, Spinner } from '@theemeraldtree/emeraldui';
import AssetCard from '../assetcard/assetcard';
import AssetInfo from '../assetinfo/assetinfo';
import Hosts from '../../host/Hosts';
import MCVersionSelector from '../mcVersionSelector/mcVersionSelector';

const LoadingText = styled.div`
  font-size: 23pt;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: white;
  flex-flow: row;
  flex-flow: column;
  text-align: center;
`;

const List = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  margin: 0 10px;
  padding: 0 5px;
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

const Persists = styled.p`
  font-size: 14pt;
  text-align: center;
  color: white;
`;

const Header = styled.div`
  margin: 10px 20px 0 20px;
  flex-shrink: 0;

  & > div {
    display: inline-flex;
    margin: 0;
  }
`;

const SortDropdown = styled(Dropdown)`
  && {
    width: 130px;
    margin-right: 5px;
    margin-bottom: 5px;
  }
`;

const MCVerSel = styled(MCVersionSelector)`
  && {
    width: 168px;
  }
`;

export default class DiscoverList extends Component {
  isMounted = true;

  constructor(props) {
    super(props);
    this.listRef = React.createRef();
    this.state = {
      displayState: '',
      assets: [],
      loading: true,
      cantConnect: false,
      isSearching: false,
      sortValue: 'popular',
      mcVerValue: 'All'
    };
  }

  static getDerivedStateFromProps(props) {
    return {
      displayState: props.state,
      progressState: props.progressState
    };
  }

  componentDidMount() {
    this.browseAssets();
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.searchTerm !== this.props.searchTerm) {
      return true;
    } if (nextProps.progressState !== this.props.progressState) {
      return true;
    } if (nextProps.state !== this.props.state) {
      return true;
    } if (nextState.assets !== this.state.assets) {
      return true;
    } if (nextProps.forceUpdate !== this.props.forceUpdate) {
      // Very hacky fix
      return true;
    }
    return false;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.searchTerm !== this.props.searchTerm) {
      this.renderSearchChange();
    }
    if (prevProps.progressState !== this.props.progressState) {
      this.updateProgressStates();
    }
    if (prevProps.state !== this.props.state) {
      this.stateChange();
    }
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  browseAssets = async (options = { sort: 'popular', minecraftVersion: 'All' }) => {
    const { host, type } = this.props;
    this.setState({
      displayState: 'browseAssets',
      isSearching: false,
      cantConnect: false
    });

    const assets = await Hosts.getTopAssets(host, type, options);
    if (this.isMounted && assets) {
      this.setState({
        assets,
        loading: false
      });
    } else if (this.isMounted) {
      this.setState({
        cantConnect: true
      });
    }
  };

  updateProgressStates = () => {
    this.setState({});
  };

  showAsset = e => {
    const { displayState } = this.state;
    if (displayState === 'browseAssets') {
      let scrollPos;
      if (this.listRef) {
        scrollPos = this.listRef.current.scrollTop;
      }

      const mod = Hosts.cache.assets[e.currentTarget.dataset.cachedid];
      this.props.stateChange('viewAsset');
      this.setState({
        previousState: 'browseAssets',
        displayState: 'viewAsset',
        activeAsset: mod,
        scrollPos
      });
    }
  };

  stateChange = () => {
    const { state } = this.props;
    if (state === 'browseAssets') {
      if (this.state.scrollPos) {
        this.listRef.current.scrollTop = this.state.scrollPos;
      }
    }
  };

  goBack = () => {
    const { displayState, previousState } = this.state;
    let newState;
    switch (displayState) {
      case 'browseAssets':
        newState = 'assetsList';
        break;
      case 'viewAsset':
        newState = previousState;
        break;
      default:
        break;
    }

    this.setState({
      displayState: newState
    });
  };

  showDescription = async () => {
    const { activeAsset } = this.state;
    const { host } = this.props;
    const newAsset = await Hosts.addMissingInfo(host, 'description', activeAsset);
    this.setState({
      activeAsset: newAsset
    });
  };

  previewStateSwitch = e => {
    const newState = e.currentTarget.dataset.state;

    if (newState === 'description') {
      this.showDescription();
    }
  };

  tryAgain = () => {
    const { displayState, isSearching } = this.state;

    if (displayState === 'browseAssets' && !isSearching) {
      this.browseAssets();
    } else if (isSearching) {
      this.renderSearch();
    }
  };

  renderSearch = async (options = { sort: 'popular', minecraftVersion: 'all' }) => {
    const { displayState } = this.state;
    const { searchTerm, type, host } = this.props;

    this.setState({
      assets: [],
      loading: true,
      isSearching: true,
      cantConnect: false
    });
    if (displayState === 'browseAssets') {
      if (searchTerm.trim() !== '') {
        const res = await Hosts.searchAssets(host, type, searchTerm, options);
        this.setState({
          assets: res,
          loading: false
        });
      } else {
        this.browseAssets(options);
      }
    }
  };

  renderSearchChange = () => {
    this.renderSearch({ sort: this.state.sortValue, minecraftVersion: this.state.mcVerValue });
  };

  sortValueChange = newValue => {
    this.setState({
      sortValue: newValue,
      loading: true
    });

    if (this.state.displayState === 'browseAssets' && !this.state.isSearching) {
      this.browseAssets({ sort: newValue, minecraftVersion: this.state.mcVerValue });
    } else if (this.state.isSearching) {
      this.renderSearch({ sort: newValue, minecraftVersion: this.state.mcVerValue });
    }
  };

  mcVerValueChange = newValue => {
    this.setState({
      mcVerValue: newValue,
      loading: true
    });

    if (this.state.displayState === 'browseAssets' && !this.state.isSearching) {
      this.browseAssets({ sort: this.state.sortValue, minecraftVersion: newValue });
    } else if (this.state.isSearching) {
      this.renderSearch({ sort: this.state.sortValue, minecraftVersion: newValue });
    }
  };

  render() {
    const {
      displayState,
      assets,
      loading,
      activeAsset,
      progressState,
      cantConnect,
      sortValue,
      mcVerValue
    } = this.state;
    const {
      type,
      forceFramework,
      installClick,
      versionInstall,
      allowVersionReinstallation,
      host,
      mcVerFilter,
      forceVersionFilter,
      specificMCVer
    } = this.props;

    const sortOptions = [
      {
        id: 'popular',
        name: 'Popularity'
      },
      {
        id: 'featured',
        name: 'Featured'
      },
      {
        id: 'downloads',
        name: 'Downloads'
      },
      {
        id: 'a-z',
        name: 'Name (A-Z)'
      },
      {
        id: 'author',
        name: 'Author'
      }
    ];

    return (
      <>
        {displayState === 'browseAssets' && (
          <>
            <Header>
              <SortDropdown onChange={this.sortValueChange} items={sortOptions} value={sortValue} />
              <MCVerSel showAll onChange={this.mcVerValueChange} value={mcVerValue} />
            </Header>
            <List ref={this.listRef}>
              {assets &&
                assets.length >= 1 &&
                !loading &&
                assets.map(asset => {
                  if (!progressState[asset.id]) {
                    progressState[asset.id] = {};
                  }
                  return (
                    <AssetCard
                      key={asset.id}
                      progressState={progressState[asset.id]}
                      onClick={this.showAsset}
                      installClick={this.props.installClick}
                      showInstall
                      showBlurb
                      asset={asset}
                    />
                  );
                })}
              {assets && assets.length === 0 && !loading && <LoadingText key="none">No Results</LoadingText>}
            </List>
            {loading && !cantConnect && (
              <LoadingText>
                <Spinner />
              </LoadingText>
            )}
            {cantConnect && (
              <LoadingText>
                can't connect
                <TryAgain onClick={this.tryAgain}>try again</TryAgain>
              </LoadingText>
            )}

            {!assets && (
              <>
                <LoadingText>
                  something's strange
                  <br />
                  we can't find anything
                  <br />
                  <TryAgain onClick={this.tryAgain}>try again</TryAgain>
                  <Persists>
                    problem persists? <a href="https://theemeraldtree.net/mcm/issues">report it here</a>
                  </Persists>
                </LoadingText>
              </>
            )}
          </>
        )}
        {displayState === 'viewAsset' && (
          <AssetInfo
            host={host}
            allowVersionReinstallation={allowVersionReinstallation}
            specificMCVer={type === 'mod' ? specificMCVer : undefined}
            versionInstall={versionInstall}
            progressState={progressState[activeAsset.id]}
            localAsset={false}
            forceVersionFilter={forceVersionFilter}
            mcVerFilter={mcVerFilter}
            asset={activeAsset}
            installClick={installClick}
            type={type}
            forceFramework={forceFramework}
          />
        )}
      </>
    );
  }
}

DiscoverList.propTypes = {
  host: PropTypes.string.isRequired,
  type: PropTypes.string,
  progressState: PropTypes.object,

  forceFramework: PropTypes.string,
  forceVersionFilter: PropTypes.bool,
  mcVerFilter: PropTypes.string,
  allowVersionReinstallation: PropTypes.bool,
  specificMCVer: PropTypes.string,

  installClick: PropTypes.func,
  versionInstall: PropTypes.func,
  stateChange: PropTypes.func,

  searchTerm: PropTypes.string,

  state: PropTypes.string,

  forceUpdate: PropTypes.number
};

DiscoverList.defaultProps = {
  progressState: {}
};
