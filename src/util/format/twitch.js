import path from 'path';
import fs from 'fs';
import ADMZip from 'adm-zip';
import Global from '../global';
import logInit from '../logger';
import FSU from '../fsu';
import Curse from '../../host/curse/curse';
import HTTPRequest from '../../host/httprequest';
import Downloader from '../downloader';
import ProfilesManager from '../../manager/profilesManager';
import DownloadsManager from '../../manager/downloadsManager';
import ForgeFramework from '../../framework/forge/forgeFramework';

const logger = logInit('Twitch-Compat');

/**
 * Twitch-format Importer/Exporter utility
 */
const Twitch = {
  /**
   * Imports a Twitch-format ZIP file
   * @param {string} zipPath - The path of the ZIP that's being imported
   * @param {function} updateState - Called when anything happens, used to show info to the user
   */
  importZip(zipPath, updateState, extraData) {
    return new Promise(async (resolve, reject) => {
      const zip = new ADMZip(zipPath);

      const extractedPath = path.join(Global.MCM_TEMP, `/twitch-profileimport-${new Date().getTime()}`);

      updateState('Extracting...');

      try {
        zip.extractAllToAsync(extractedPath, false, e => {
          if (e) {
            logger.error(`Unable to extract Twitch zip: ${e}`);
            reject(new Error('Unable to extract ZIP'));
          } else {
            this.importDir(extractedPath, updateState, extraData).then(() => {
              resolve();
            }).catch(err => {
              reject(err);
            });
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },
  /**
   * Imports a Twitch-format directory
   * @param {string} dirPath - The path of the directory that's being imported
   * @param {function} updateState - Called when anything happens, used to show info to the user
   */
  importDir(dirPath, updateState, extraData = { }) {
    return new Promise(async (resolve, reject) => {
      const manifestPath = path.join(dirPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        updateState('Reading manifest...');
        const manifest = await FSU.readJSON(manifestPath);
        if (manifest) {
          // Manifest exists and is readable;
          // we can continue processing

          updateState('Creating profile...');

          // Let's create the profile
          const { hostedAsset } = extraData;
          const name = hostedAsset ? hostedAsset.name : manifest.name;

          let profile;
          try {
            profile = await ProfilesManager.createProfile(name, manifest.minecraft.version);
          } catch (e) {
            // Error creating profile
            reject(e);
          }

          if (hostedAsset) {
            updateState('Assigning data...');
            Object.assign(profile, hostedAsset);

            // Apply "fully installed" status;
            // We're assuming Curse here
            profile.hosts.curse.fullyInstalled = false;
            profile.hosts.curse.fileID = extraData.version.fileID;
            profile.hosts.curse.fileName = extraData.version.fileName;
          }

          updateState('Setting versions...');

          profile.state = 'installing';
          profile.changeMCVersion(manifest.minecraft.version);
          ProfilesManager.updateProfile(profile);

          if (manifest.minecraft.modLoaders[0]) {
            // Set the forge version
            profile.setFrameworkVersion('forge', `${manifest.minecraft.version}-${manifest.minecraft.modLoaders[0].id.substring(6)}`);
          }

          profile.save();

          updateState('Collecting assets...');
          // Let's get the list of assets to install now
          let assetsList = [];

          try {
            // We'll try to download info for all of the assets at once,
            // to save network requests
            const projectIDs = manifest.files.map(file => file.required && file.projectID);
            const returnedCurseData = (await HTTPRequest.post(Curse.URL_BASE, projectIDs)).data;

            // We have to check lengths, because sometimes CurseForge doesn't return everything
            if (returnedCurseData.length === projectIDs.length) {
              assetsList = returnedCurseData.map(rawAsset => {
                // Convert the asset to OMAF format
                const asset = Curse.convertToOMAF(rawAsset);

                // Apply file info and a cachedID
                asset.hosts.curse.fileID = manifest.files.find(mf => mf.projectID === rawAsset.id).fileID;
                asset.cachedID = `twitch-asset-install-${asset.id}`;
                return asset;
              });
            } else {
              throw new Error('Curse data does not match');
            }
          } catch (e) {
            // Downloading info for every asset at once has failed;
            // instead we'll download info for each asset
            logger.info('Unable to download all asset info at once; maybe an asset is removed from CurseForge?');

            assetsList = manifest.files.filter(file => file.required).map(file => ({
              type: 'mod', // mod is an assumed type
              hosts: {
                curse: {
                  id: file.projectID,
                  fileID: file.fileID
                }
              },
              cachedID: `twitch-asset-install-${file.projectID}`
            }));
          }

          updateState('Downloading assets...');

          // Now we have the list of assets to install;
          // We'll pass it off to the Downloader
          await Downloader.downloadHostedAssets('curse', assetsList, profile);

          // The assets have been downloaded
          // Let's apply some finishing touches

          if (manifest.projectID || hostedAsset) {
            updateState('Downloading extra info from Curse...');
            // This project is published on CurseForge
            // We'll download the icon and some extra info about it
            profile.hosts.curse = {
              id: hostedAsset.hosts.curse?.id ? hostedAsset.hosts.curse.id : manifest.projectID
            };

            const fullAsset = await Curse.getFullAsset(profile, 'profile');
            const description = await Curse.getDescription(profile);

            Object.assign(profile, fullAsset);

            profile.description = description;

            if (fullAsset.iconURL) {
              await DownloadsManager.startFileDownload(
                `Icon\n_A_${fullAsset.name}`,
                fullAsset.iconURL,
                path.join(profile.profilePath, `/icon${path.extname(profile.iconURL)}`));

              profile.icon = `icon${path.extname(profile.iconURL)}`;
              profile.iconURL = undefined;
            }

            profile.hosts.curse.fullyInstalled = true;

            if (hostedAsset) {
              updateState('Reassigning host data...');
              profile.hosts.curse.fileID = extraData.version.fileID;
              profile.hosts.curse.fileName = extraData.version.fileName;
              profile.version.displayName = extraData.version.fileName;
              profile.version.hosts = {
                curse: {
                  fileID: extraData.version.fileID
                }
              };
            }

            profile.save();
          }

          updateState('Copying overrides...');
          if (manifest.overrides) {
            if (fs.existsSync(path.join(dirPath, manifest.overrides))) {
              await FSU.copyDir(path.join(dirPath, manifest.overrides), profile.gameDir);
            }
          }

          if (profile.getPrimaryFramework() !== 'none') {
            if (profile.frameworks.forge) {
              updateState('Installing Forge...');
              await ForgeFramework.setupForge(profile);
            }
          }

          ProfilesManager.updateProfile(profile);
          Global.updateCache();
          resolve();
        } else {
          reject(new Error('Manifest contains nothing or is unreadable'));
        }
      } else {
        reject(new Error('Manifest does not exist'));
      }
    });
  }
};

export default Twitch;
