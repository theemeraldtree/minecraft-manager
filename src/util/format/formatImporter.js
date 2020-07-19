import AdmZip from 'adm-zip';
import ProfilesManager from '../../manager/profilesManager';
import MultiMC from './multimc';
import Twitch from './twitch';

const FormatImporter = {
  /**
   * Returns the name of the format stored by the file specified, or undefined if none is found
   * @param {string} file - The file to check
   */
  getImportType(file) {
    try {
      const zip = new AdmZip(file);
      const entries = zip.getEntries();

      let type;
      entries.forEach(entry => {
        switch (entry.name) {
          case 'profile.json':
            // Minecraft Manager/OMAF format
            type = 'omaf';
            break;
          case 'mmc-pack.json':
          case 'instance.cfg':
            // MultiMC
            type = 'multimc';
            break;
          case 'manifest.json':
            // Twitch
            type = 'twitch';
            break;
          default:
            break;
        }
      });

      return type;
    } catch (e) {
      // Unable to open as a zip; not a readable format
      return undefined;
    }
  },

  /**
   * Reads a file, then imports it using the correct importer
   * @param {string} file - The path of the file to import
   */
  importFile(file, stateChange) {
    const type = this.getImportType(file);
    if (type) {
      switch (type) {
        case 'omaf':
          return ProfilesManager.importProfile(file, stateChange);
        case 'multimc':
          return MultiMC.import(file, stateChange);
        case 'twitch':
          return Twitch.importZip(file, stateChange);
        default:
          return new Promise((_, reject) => { reject(Error(`Unrecognized type "${type}" returned as import type.`)); });
      }
    } else {
      return new Promise((_, reject) => { reject(new Error('Unreadable Format')); });
    }
  }
};

export default FormatImporter;
