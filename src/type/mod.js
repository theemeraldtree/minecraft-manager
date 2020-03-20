import OMAFFileAsset from './omafFileAsset';

/**
 * Mod Class
 */
export default class Mod extends OMAFFileAsset {
  /**
   * Sets the JAR file of this mod (e.g. mainFile type of JAR)
   * @param {string} newJARFile - The name of the new JAR File
   */
  setJARFile(newJARFile) {
    super.setMainFile('mods/', 'jar', newJARFile);
  }
}
