import React, { useState, useEffect, useContext, useReducer } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Redirect } from 'react-router-dom';
import { Button, Dropdown, Detail } from '@theemeraldtree/emeraldui';
import ProfilesManager from '../../../manager/profilesManager';
import OptionBreak from '../components/optionbreak';
import Overlay from '../../../component/overlay/overlay';
import Hosts from '../../../host/Hosts';
import AlertManager from '../../../manager/alertManager';
import ToastManager from '../../../manager/toastManager';
import NavContext from '../../../navContext';
import ForgeFramework from '../../../framework/forge/forgeFramework';
import FabricFramework from '../../../framework/fabric/fabricFramework';
import MCVersionSelector from '../../../component/mcVersionSelector/mcVersionSelector';
import FrameworkInstaller from './frameworkInstaller';

const CustomVersions = styled.div`
  background-color: #2b2b2b;
  width: 350px;
  padding: 10px;
  margin-bottom: 5px;

  h3 {
    margin: 0;
  }

  button {
    margin-top: 5px;
  }
`;

const BG = styled.div`
  width: 100%;
  height: fit-content;
  max-width: 400px;
  max-height: 500px;
  background-color: #222;
  padding: 10px;
  color: white;
  display: flex;
  flex-flow: column;
`;

const Title = styled.p`
  margin: 0;
  font-weight: 200;
  font-size: 21pt;
`;

export default function EditPageVersions({ id }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const { header } = useContext(NavContext);

  const [profile, setProfile] = useState(ProfilesManager.getProfileFromID(id));
  const [mcverValue, setMCVerValue] = useState(profile.version.minecraft.version);
  const [curseVerValue, setCurseVerValue] = useState('');
  const [hostVersionValues, setHostVersionValues] = useState(undefined);

  const [updateOverlay, setUpdateOverlay] = useState(false);
  const [updateOverlayText, setUpdateOverlayText] = useState('getting things ready...');

  const [fabricIsInstalling, setFabricIsInstalling] = useState(false);
  const [fabricIsUninstalling, setFabricIsUninstalling] = useState(false);

  const [forgeIsInstalling, setForgeIsInstalling] = useState(false);
  const [forgeIsUninstalling, setForgeIsUninstalling] = useState(false);

  const [showConfirmForge, setShowConfirmForge] = useState(false);
  const [showConfirmFabric, setShowConfirmFabric] = useState(false);

  let isMounted = true;

  const reloadCurseVersionsList = async () => {
    if (profile.hosts) {
      if (profile.hosts.curse) {
        const versions = await Hosts.getVersions('curse', profile);
        let nameArray = [];
        versions[0].latest = true;
        nameArray = versions.map(ver => {
          let name = ver.displayName;

          if (ver.latest) name += ' (latest)';
          if (profile.version.displayName === ver.displayName) {
            name += ' (current)';
          }

          return {
            name,
            id: ver.hosts.curse.fileID
          };
        });

        setHostVersionValues(nameArray);
        setCurseVerValue(profile.version.hosts.curse.fileID);
      }
    }
  };

  const confirmCurseVerChange = async () => {
    setUpdateOverlay(true);
    header.setBackLink('/');
    profile
      .changeHostVersion('curse', profile.temp.versionToChangeTo, updtext => {
        setUpdateOverlayText(updtext);
      })
      .then(newprofile => {
        setProfile({
          name: 'hang on...',
          hosts: {},
          frameworks: {}
        });
        setProfile(newprofile);
        setUpdateOverlay(false);
        header.setBackLink(`/profile/${profile.id}`);
      })
      .catch(() => {
        setUpdateOverlay(false);
        header.setBackLink(`/profile/${profile.id}`);
        reloadCurseVersionsList();
      });
  };

  const uninstallForge = () => {
    setForgeIsUninstalling(true);
    ForgeFramework.uninstallForge(profile).then(() => {
      setForgeIsUninstalling(false);
    });
  };

  const uninstallFabric = () => {
    setFabricIsUninstalling(true);
    FabricFramework.uninstallFabric(profile).then(() => {
      setFabricIsUninstalling(false);
    });
  };

  const confirmVersionChange = newVer => {
    profile.changeMCVersion(newVer);
    profile.progressState = {};
    uninstallForge();
    uninstallFabric();

    setMCVerValue(newVer);
  };

  const mcverChange = (version, cancel) => {
    if (!profile.hasFramework()) {
      setMCVerValue(version);
      profile.progressState = {};
      profile.changeMCVersion(version);
    } else {
      cancel();
      AlertManager.alert(
        'warning',
        'Changing your Minecraft version will remove Forge/Fabric and all of your mods. Are you sure you want to change?',
        () => confirmVersionChange(version),
        'change',
        "don't change"
      );
    }
  };

  const downloadFabric = async versionT => {
    setFabricIsInstalling(true);

    let version = versionT;
    if (versionT === 'latest') {
      let versions;
      try {
        versions = await FabricFramework.getFabricLoaderVersions(profile.version.minecraft.version);
      } catch (err) {
        ToastManager.createToast('Error', 'Unable to get the latest Fabric versions');
        setFabricIsInstalling(false);

        return;
      }
      if (versions) {
        if (versions[0]) {
          version = versions[0].loader.version;
        } else {
          AlertManager.messageBox(
            'no fabric version',
            `There is no Fabric version available for Minecraft ${profile.version.minecraft.version}`
          );
          setFabricIsInstalling(false);
          return;
        }
      } else {
        ToastManager.createToast(
          'Error',
          "We can't reach the Fabric servers. Check your internet connection, and try again."
        );
        setFabricIsInstalling(false);
        return;
      }
    }

    profile.setFrameworkVersion('fabric', version);
    FabricFramework.setupFabric(profile).then(() => {
      if (isMounted) setFabricIsInstalling(false);
    });
  };

  const downloadForge = async versionT => {
    setForgeIsInstalling(true);

    let version = versionT;
    if (versionT === 'latest') {
      const promos = await ForgeFramework.getForgePromotions();
      if (!promos) {
        ToastManager.createToast(
          'Error',
          "We can't reach the Forge servers. Check your internet connection, and try again."
        );
        return;
      }

      const latestPromo = promos.promos[`${profile.version.minecraft.version}-latest`];

      if (!latestPromo) {
        AlertManager.messageBox(
          'no minecraft forge version',
          `There is no Minecraft Forge version available for Minecraft ${profile.version.minecraft.version}`
        );
        setForgeIsInstalling(false);
        return;
      }

      version = `${profile.version.minecraft.version}-${latestPromo.version}`;
    }

    profile.setFrameworkVersion('forge', version);
    ForgeFramework.setupForge(profile).then(() => {
      if (isMounted) setForgeIsInstalling(false);
    });
  };

  const curseVersionChange = e => {
    profile.temp = {};
    profile.temp.versionToChangeTo = e;
    forceUpdate();
    AlertManager.alert(
      'are you sure?',
      `updating or changing a profile's version will modify the current files. a backup will be created of the current files. if you've modified files or added mods, you will need to move then over from the backup
            <br>
            <b>the saves folder and options.txt are automatically moved.`,
      confirmCurseVerChange,
      'i understand, continue'
    );
  };

  const updateIsInstalling = () => {
    setForgeIsInstalling(profile.frameworks.forge ? profile.frameworks.forge.isInstalling : false);
    setFabricIsInstalling(profile.frameworks.fabric ? profile.frameworks.fabric.isInstalling : false);
  };

  useEffect(() => {
    setMCVerValue(profile.version.minecraft.version);
    reloadCurseVersionsList();
    updateIsInstalling();

    ProfilesManager.registerReloadListener(updateIsInstalling);

    return () => {
      isMounted = false;
      ProfilesManager.unregisterReloadListener(updateIsInstalling);
    };
  }, []);

  useEffect(() => {
    reloadCurseVersionsList();
  }, [profile]);

  if (profile) {
    return (
      <>
        <FrameworkInstaller
          cancelClick={() => setShowConfirmForge(false)}
          profile={profile}
          framework="forge"
          installClick={downloadForge}
          show={showConfirmForge}
        />

        <FrameworkInstaller
          cancelClick={() => setShowConfirmFabric(false)}
          profile={profile}
          framework="fabric"
          installClick={downloadFabric}
          show={showConfirmFabric}
        />
        {updateOverlay && (
          <Overlay force>
            <BG>
              <Title>{updateOverlayText}</Title>
              <p>To check progress, open the Downloads viewer in the sidebar.</p>
            </BG>
          </Overlay>
        )}
        {!profile.hosts.curse && (
          <>
            <Detail>minecraft version</Detail>
            <MCVersionSelector
              onChange={mcverChange}
              value={mcverValue}
              disabled={forgeIsInstalling || fabricIsInstalling}
              dontAutoSelectFirst
            />
            <OptionBreak />
          </>
        )}
        {profile.hosts.curse && (
          <>
            <Detail>profile version</Detail>
            {hostVersionValues && (
              <Dropdown
                value={curseVerValue}
                onChange={curseVersionChange}
                items={hostVersionValues}
                disabled={forgeIsInstalling || fabricIsInstalling}
              />
            )}
          </>
        )}

        <OptionBreak />
        <Detail>modloaders</Detail>
        {!profile.frameworks.fabric && !fabricIsInstalling && (
          <CustomVersions>
            <h3>Minecraft Forge</h3>
            <Detail>The most popular modloader. Currently used in just about every mod.</Detail>
            {!profile.frameworks.forge && !forgeIsInstalling && (
              <Button onClick={() => setShowConfirmForge(true)} color="green">
                install
              </Button>
            )}
            {forgeIsInstalling && (
              <p>
                Forge is installing. This may take a while. To check progress, open the Downloads viewer in the sidebar
              </p>
            )}
            {forgeIsUninstalling && <p>Forge is being removed...</p>}
            {profile.frameworks.forge && !forgeIsUninstalling && !forgeIsInstalling && (
              <>
                <p>Version: {profile.frameworks.forge.version}</p>
                <Button onClick={uninstallForge} color="red">
                  uninstall
                </Button>
              </>
            )}
          </CustomVersions>
        )}
        {!profile.frameworks.forge && !forgeIsInstalling && (
          <CustomVersions>
            <h3>Fabric</h3>
            <Detail>The Next-Generation Modloader. Currently used in small, quality-of-life mods.</Detail>
            {!profile.frameworks.fabric && !fabricIsInstalling && (
              <Button onClick={() => setShowConfirmFabric(true)} color="green">
                install
              </Button>
            )}
            {fabricIsInstalling && (
              <p>Fabric is installing. To check progress, open the Downloads viewer in the sidebar</p>
            )}
            {fabricIsUninstalling && <p>Fabric is being removed...</p>}
            {profile.frameworks.fabric && !fabricIsUninstalling && !forgeIsInstalling && (
              <>
                <p>Version: {profile.frameworks.fabric.version}</p>
                <Button onClick={uninstallFabric} color="red">
                  uninstall
                </Button>
              </>
            )}
          </CustomVersions>
        )}
      </>
    );
  }

  return <Redirect to="/" />;
}

EditPageVersions.propTypes = {
  id: PropTypes.string.isRequired
};
