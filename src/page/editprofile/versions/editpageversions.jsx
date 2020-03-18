import React, { useState, useEffect, useContext, useReducer } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Redirect } from 'react-router-dom';
import ProfilesManager from '../../../manager/profilesManager';
import Detail from '../../../component/detail/detail';
import OptionBreak from '../components/optionbreak';
import Button from '../../../component/button/button';
import CustomDropdown from '../../../component/customdropdown/customdropdown';
import Overlay from '../../../component/overlay/overlay';
import Hosts from '../../../host/Hosts';
import AlertManager from '../../../manager/alertManager';
import ToastManager from '../../../manager/toastManager';
import NavContext from '../../../navContext';
import ForgeFramework from '../../../framework/forge/forgeFramework';
import FabricFramework from '../../../framework/fabric/fabricFramework';
import MCVersionSelector from '../../../component/mcVersionSelector/mcVersionSelector';

const CustomVersions = styled.div`
  background-color: #2b2b2b;
  width: 350px;
  padding: 10px;
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
  const [newVersion, setNewVersion] = useState('');
  const [mcverValue, setMCVerValue] = useState('');
  const [curseVerValue, setCurseVerValue] = useState('');
  const [hostVersionValues, setHostVersionValues] = useState(undefined);

  const [updateOverlay, setUpdateOverlay] = useState(false);
  const [updateOverlayText, setUpdateOverlayText] = useState('getting things ready...');

  const [fabricIsInstalling, setFabricIsInstalling] = useState(false);
  const [fabricIsUninstalling, setFabricIsUninstalling] = useState(false);

  const [forgeIsInstalling, setForgeIsInstalling] = useState(false);
  const [forgeIsUninstalling, setForgeIsUninstalling] = useState(false);

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

  const confirmVersionChange = () => {
    profile.changeMCVersion(newVersion);
    profile.progressState = {};
    uninstallForge();
    uninstallFabric();

    setMCVerValue(newVersion);
  };

  const mcverChange = (version, cancel) => {
    if (!profile.hasFramework()) {
      setMCVerValue(version);
      profile.progressState = {};
      profile.changeMCVersion(version);
    } else {
      cancel();
      setNewVersion(version);
      AlertManager.alert(
        'warning',
        'changing your minecraft version will remove forge/fabric and all your mods. are you sure you want to change?',
        confirmVersionChange,
        'change',
        "don't change"
      );
    }
  };

  const downloadFabric = () => {
    setFabricIsInstalling(true);
    FabricFramework.getFabricLoaderVersions(profile.version.minecraft.version)
      .then(versions => {
        const version = versions[0];
        if (version) {
          profile.setFrameworkVersion('fabric', version.loader.version);
          FabricFramework.setupFabric(profile).then(() => {
            setFabricIsInstalling(false);
          });
        } else {
          setFabricIsInstalling(false);
          AlertManager.messageBox(
            'no fabric version',
            `there is no fabric version available for minercaft ${profile.version.minecraft.version}`
          );
        }
      })
      .catch(() => {
        setFabricIsInstalling(false);
      });
  };

  const downloadForge = () => {
    setForgeIsInstalling(true);
    ForgeFramework.getForgePromotions().then(promos => {
      if (promos) {
        const obj = JSON.parse(promos);
        const verObj = obj.promos[`${profile.version.minecraft.version}-latest`];
        if (verObj) {
          const version = `${profile.version.minecraft.version}-${verObj.version}`;
          profile.setFrameworkVersion('forge', version);
          ForgeFramework.setupForge(profile).then(() => {
            setForgeIsInstalling(false);
          });
        } else {
          setForgeIsInstalling(false);
          AlertManager.messageBox(
            'no forge version',
            `there is no forge version available for minecraft ${profile.version.minecraft.version}`
          );
        }
      } else {
        setForgeIsInstalling(false);
        ToastManager.createToast(
          'Error',
          "We can't reach the Forge servers. Check your internet connection, and try again."
        );
      }
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

  useEffect(() => {
    setMCVerValue(profile.version.minecraft.version);
    reloadCurseVersionsList();
  }, []);

  useEffect(() => {
    reloadCurseVersionsList();
  }, [profile]);

  if (profile) {
    return (
      <>
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
            {mcverValue && (
              <MCVersionSelector
                onChange={mcverChange}
                value={mcverValue}
                disabled={forgeIsInstalling || fabricIsInstalling}
              />
            )}
            <OptionBreak />
          </>
        )}
        {profile.hosts.curse && (
          <>
            <Detail>profile version</Detail>
            {hostVersionValues && (
              <CustomDropdown
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
            <Detail>forge</Detail>
            {!profile.frameworks.forge && !forgeIsInstalling && (
              <Button onClick={downloadForge} color="green">
                install forge
              </Button>
            )}
            {forgeIsInstalling && (
              <p>Forge is installing. To check progress, open the Downloads viewer in the sidebar</p>
            )}
            {forgeIsUninstalling && <p>Forge is being removed...</p>}
            {profile.frameworks.forge && !forgeIsUninstalling && (
              <>
                <p>Version: {profile.frameworks.forge.version}</p>
                <Button onClick={uninstallForge} color="red">
                  uninstall forge
                </Button>
              </>
            )}
          </CustomVersions>
        )}
        {!profile.frameworks.forge && !forgeIsInstalling && (
          <CustomVersions>
            <Detail>fabric</Detail>
            {!profile.frameworks.fabric && !fabricIsInstalling && (
              <Button onClick={downloadFabric} color="green">
                install fabric
              </Button>
            )}
            {fabricIsInstalling && (
              <p>Fabric is installing. To check progress, open the Downloads viewer in the sidebar</p>
            )}
            {fabricIsUninstalling && <p>Fabric is being removed...</p>}
            {profile.frameworks.fabric && (
              <>
                <p>Version: {profile.frameworks.fabric.version}</p>
                <Button onClick={uninstallFabric} color="red">
                  uninstall fabric
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
