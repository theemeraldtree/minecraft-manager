import OMAFAsset from './omafAsset';

/**
 * An OMAF Asset the has a "main file"
 */
export default class OMAFFileAsset extends OMAFAsset {
  constructor(json) {
    super(json);
    this.checkMissing();
  }

  /**
   * Checks for missing values, and creates them
   */
  checkMissing() {
    if (!this.files) this.files = [];
  }

  /**
   * Sets the main file of this asset
   * @param {string} pathRoot - The "root path" of this file (e.g. "/mods/")
   * @param {string} type - The OMAF File Type of this file (e.g. "jar")
   * @param {string} mainFile - The name of the new main file
   */
  setMainFile(pathRoot, type, mainFile) {
    const existing = this.files.find(file => file.priority === 'mainFile');

    if (existing) {
      existing.path = `${pathRoot}/${mainFile}`;
    } else {
      this.files.push({
        displayName: 'Main File',
        type,
        priority: 'mainFile',
        path: `${pathRoot}/${mainFile}`
      });
    }
  }

  /**
   * Get the current main file
   * @returns {object}
   */
  getMainFile() {
    if (this.files) {
      const file = this.files.find(f => f.priority === 'mainFile');
      if (file) return file;
    }

    return {
      path: ''
    };
  }
}
