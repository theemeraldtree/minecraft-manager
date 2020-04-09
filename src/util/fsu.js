import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

/**
 * File System Utilities
 */
const FSU = {
  /**
   * Copies a file, and creates the missing directories to the destination if they do not exist
   * @param {string} path1 - The source path
   * @param {string} path2 - The destination path
   */
  copyFileMakeDirSync(path1, path2) {
    if (!fs.existsSync(path.dirname(path2))) {
      mkdirp.sync(path.dirname(path2));
    }

    fs.copyFileSync(path1, path2);
  },

  /**
   * Renames a directory, and creates the missing directories to the destination if they do not exist
   * @param {string} path1 - The source path
   * @param {string} path2 - The destination path
   */
  renameMakeDirSync(path1, path2) {
    if (!fs.existsSync(path.dirname(path2))) {
      mkdirp.sync(path.dirname(path2));
    }

    fs.renameSync(path1, path2);
  },

  /**
   * Read the JSON from the requested path
   * @param {string} jsonPath - The path to read the JSON from
   */
  readJSONSync(jsonPath) {
    return JSON.parse(fs.readFileSync(jsonPath));
  },

  /**
   * Read the JSON from the requested path asynchronously
   * @param {string} jsonPath - The path to read the JSON from
   */
  async readJSON(jsonPath) {
    return JSON.parse(await fs.promises.readFile(jsonPath));
  },

  /**
   * Creates a directory if it doesn't exist
   * @param {string} dirPath - The directory to create
   */
  createDirIfMissing(dirPath) {
    if (!fs.existsSync(dirPath)) mkdirp.sync(dirPath);
  },

  /**
   * Creates an empty file if it doesn't exist
   * @param {string} filePath - The file to create
   */
  createFileIfMissing(filePath) {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '');
  },

  /**
   * Deletes a file if it exists
   * @param {string} filePath - The file to delete
   */
  deleteFileIfExists(filePath) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};

export default FSU;
