import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

const FSUtil = {
  copyFileMakeDirSync(path1, path2) {
    if (!fs.existsSync(path.dirname(path2))) {
      mkdirp.sync(path.dirname(path2));
    }

    fs.copyFileSync(path1, path2);
  },
  renameMakeDirSync(path1, path2) {
    if (!fs.existsSync(path.dirname(path2))) {
      mkdirp.sync(path.dirname(path2));
    }

    fs.renameSync(path1, path2);
  }
};

export default FSUtil;
