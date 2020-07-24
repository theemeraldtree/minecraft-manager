import React, { useState, useEffect, useContext, useReducer } from 'react';
import fs from 'fs';
import path from 'path';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Redirect } from 'react-router-dom';
import { Button, Dropdown, Detail, Spinner } from '@theemeraldtree/emeraldui';
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
import MCLauncherIntegrationHandler from '../../../minecraft/mcLauncherIntegrationHandler';
import SettingsManager from '../../../manager/settingsManager';
import MCVersionHandler from '../../../minecraft/mcVersionHandler';

const { dialog } = require('electron').remote;

const ModloaderSection = styled.div`
  background-color: #2b2b2b;
  width: 440px;
  padding: 10px;
  margin-bottom: 5px;
  display: flex;
  flex-flow: row;
  height: 47px;

  > div:first-child {
    flex: 1;
  }

  h3 {
    margin: 0;
  }

  button {
    margin-top: 5px;
  }

  .spinner {
    margin-top: -17px;
    transform: scale(0.5);
  }

  ${props => props.disabled && css`
    filter: brightness(0.75);
  `}
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

const TinySpinner = styled.div`
  width: 300px;
  height: 40px;
  background-color: #404040;
  display: flex;
  justify-content: center;
  align-items: center;
  & > div {
    transform: scale(0.4);
  }
`;

const Card = styled.div`
  width: 450px;
  background: #2b2b2b;
  padding: 5px;
  margin-top: 5px;
  display: flex;

  > img {
    width: 30px;
  }

  h1 {
    margin: 0;
    font-size: 15pt;
    font-weight: 700;
  }

  > .flex-fill {
    flex: 1 1 auto;
    display: flex;
    flex-flow: column;
    justify-content: center;
  }

  .version-detail {
    color: #c1c1c1;
    margin-top: 10px;
    font-size: 9pt;
  }

  .version-detail p {
    margin: 0;
  }
`;

const HeaderCard = styled(Card)`
  background: #424242;
`;

const CardMCVersionSelector = styled(MCVersionSelector)`
  width: 200px;
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

  const [jarMods, setJarMods] = useState([]);

  let isMounted = true;

  const reloadCurseVersionsList = async () => {
    if (profile.hosts && profile.version.hosts) {
      if (profile.hosts.curse && profile.version.hosts.curse) {
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
          frameworks: {},
          version: {
            minecraft: {
              version: 'hang on'
            }
          }
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
    MCVersionHandler.updateProfile(profile, true);
    profile.progressState = {};

    if (profile.frameworks.forge) uninstallForge();
    if (profile.frameworks.fabric) uninstallFabric();

    setMCVerValue(newVer);
  };

  const mcverChange = (version, cancel) => {
    if (!profile.hasFramework()) {
      setMCVerValue(version);
      profile.progressState = {};
      profile.changeMCVersion(version);
      MCVersionHandler.updateProfile(profile, true);
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
    FabricFramework.setupFabric(profile)
      .then(() => {
        if (isMounted) setFabricIsInstalling(false);
        if (SettingsManager.currentSettings.launcherIntegration) MCLauncherIntegrationHandler.integrate();
      })
      .catch(err => {
        if (isMounted) setFabricIsInstalling(false);
        AlertManager.messageBox('error installing fabric', err);
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
        const forgeVersions = await ForgeFramework.getForgeVersions(profile.version.minecraft.version);
        if (!forgeVersions) {
          AlertManager.messageBox(
            'no minecraft forge version',
            `There is no Minecraft Forge version available for Minecraft ${profile.version.minecraft.version}`
          );
          setForgeIsInstalling(false);
          return;
        }

        let firstVersion = forgeVersions[forgeVersions.length - 1];
        if (firstVersion.substring(0, profile.version.minecraft.version.length) === profile.version.minecraft.version) {
          firstVersion = firstVersion.substring(profile.version.minecraft.version.length + 1);
        }

        version = `${profile.version.minecraft.version}-${firstVersion}`;
      } else {
        version = `${profile.version.minecraft.version}-${latestPromo.version}`;
      }
    }

    profile.setFrameworkVersion('forge', version);
    ForgeFramework.setupForge(profile)
      .then(() => {
        if (isMounted) setForgeIsInstalling(false);
        if (SettingsManager.currentSettings.launcherIntegration) MCLauncherIntegrationHandler.integrate();
      })
      .catch(err => {
        if (isMounted) setForgeIsInstalling(false);
        AlertManager.messageBox('error installing forge', err);
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

  const reloadJarMods = () => {
    const jarmodPath = path.join(profile.mcmPath, '/jarmods');
    if (fs.existsSync(jarmodPath)) {
      setJarMods(fs.readdirSync(jarmodPath).filter(file => profile.frameworks.forge?.jarmodFile !== file));
    }
  };

  useEffect(() => {
    setMCVerValue(profile.version.minecraft.version);
    reloadCurseVersionsList();
    updateIsInstalling();

    ProfilesManager.registerReloadListener(updateIsInstalling);

    reloadJarMods();

    return () => {
      isMounted = false;
      ProfilesManager.unregisterReloadListener(updateIsInstalling);
    };
  }, []);

  useEffect(() => {
    reloadCurseVersionsList();
  }, [profile]);

  const uninstallJarmod = (file) => {
    setJarMods(jarMods.filter(mod => mod !== file));
    fs.unlinkSync(path.join(profile.mcmPath, `/jarmods/${file}`));
  };

  const installJarmod = () => {
    const p = dialog.showOpenDialogSync({
      title: 'Select a jar mod',
      filters: [
        {
          name: 'Jar Mod Formats',
          extensions: ['zip', 'jar']
        },
        {
          name: 'All files',
          extensions: ['*']
        }
      ],
      properties: [
        'openFile'
      ]
    });

    if (p && p[0]) {
      fs.copyFileSync(p[0], path.join(profile.mcmPath, `/jarmods/${path.basename(p[0])}`));
      reloadJarMods();
    }
  };

  const hosted = profile.hosts.curse && profile.version.hosts && profile.version.hosts.curse;

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

        <HeaderCard>
          <img alt={`${profile.name} Icon`} src={profile.iconPath} />
          <h1>{profile.name}</h1>
        </HeaderCard>

        {hosted && (
          <>
            <Detail>Instance version</Detail>
            {hostVersionValues && (
              <Dropdown
                value={curseVerValue}
                onChange={curseVersionChange}
                items={hostVersionValues}
                disabled={forgeIsInstalling || fabricIsInstalling}
              />
            )}
            {!hostVersionValues && (
              <TinySpinner>
                <Spinner />
              </TinySpinner>
            )}
          </>
        )}

        {!hosted && (
          <Card>
            <div className="flex-fill">
              <h1>Minecraft Version</h1>
            </div>
            <div>
              <CardMCVersionSelector
                onChange={mcverChange}
                value={mcverValue}
                disabled={forgeIsInstalling || fabricIsInstalling}
                dontAutoSelectFirst
              />
            </div>
          </Card>
        )}


        {
          profile.frameworks.forge && (
            <Card>
              <div className="flex-fill">
                <h1>Minecraft Forge</h1>
                <Detail>The most popular modloader.</Detail>
                <div className="version-detail">
                  <p>Minecraft Forge Version: {profile.frameworks.forge.version}</p>
                </div>
              </div>
              <div>
                <Button onClick={uninstallForge} color="#424242">
                  Uninstall
                </Button>
              </div>
            </Card>
          )
        }

        {
          profile.frameworks.fabric && (
            <Card>
              <div className="flex-fill">
                <h1>Fabric Loader</h1>
                <Detail>The next-generation modloader.</Detail>
                <div className="version-detail">
                  <p>Fabric Loader Version: {profile.frameworks.fabric.version}</p>
                </div>
              </div>
              <div>
                <Button onClick={uninstallFabric} color="#424242">
                  Uninstall
                </Button>
              </div>
            </Card>
          )
        }

        {
          jarMods.map(mod => (
            <Card key={mod}>
              <div className="flex-fill">
                <h1>{mod}</h1>
                <Detail>Jar mod</Detail>
              </div>
              <div>
                <Button onClick={() => uninstallJarmod(mod)} color="#424242">
                  Uninstall
                </Button>
              </div>
            </Card>
          ))
        }


        <OptionBreak />

        <Detail>Install Modloaders</Detail>

        {!profile.frameworks.forge && (
          <ModloaderSection disabled={(profile.frameworks.fabric !== undefined) || fabricIsInstalling}>
            <div>
              <h3>Minecraft Forge</h3>
              <Detail>The most popular modloader.</Detail>
            </div>
            <div>
              {!profile.frameworks.forge && !forgeIsInstalling && (
                <Button disabled={(profile.frameworks.fabric !== undefined) || forgeIsInstalling} onClick={() => setShowConfirmForge(true)} color="#424242">
                  Install Minecraft Forge
                </Button>
              )}
              {(forgeIsInstalling || forgeIsUninstalling) && <Spinner /> }
            </div>
          </ModloaderSection>
        )}

        {!profile.frameworks.fabric && (
          <ModloaderSection disabled={(profile.frameworks.forge !== undefined) || forgeIsInstalling}>
            <div>
              <h3>Fabric Loader</h3>
              <Detail>The next-generation modloader.</Detail>
            </div>
            <div>
              {!profile.frameworks.fabric && !fabricIsInstalling && (
                <Button disabled={(profile.frameworks.forge !== undefined) || forgeIsInstalling} onClick={() => setShowConfirmFabric(true)} color="#424242">
                  Install Fabric Loader
                </Button>
              )}
              {(fabricIsInstalling || fabricIsUninstalling) && <Spinner /> }
            </div>
          </ModloaderSection>
        )}

        <OptionBreak />

        <Detail>Advanced Actions</Detail>

        <Card>
          <Button onClick={installJarmod} color="#424242">Add jar mod</Button>
        </Card>
      </>
    );
  }

  return <Redirect to="/" />;
}

EditPageVersions.propTypes = {
  id: PropTypes.string.isRequired
};
