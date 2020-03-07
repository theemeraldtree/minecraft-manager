export default function GenericAsset(rawomaf) {
  Object.assign(this, rawomaf);

  this.localValues = ['installed', 'iconPath', 'iconURL'];
  this.checkMissing = function () {
    if (!this.hosts) {
      this.hosts = {};
    }

    if (!this.files) {
      this.files = [];
    }
  };

  this.checkMissing();

  this.setMainFile = function (pathroot, type, mainFile) {
    const existing = this.files.find((file) => file.priority === 'mainFile');

    if (existing) {
      existing.path = `${pathroot}/${mainFile}`;
    } else {
      this.files.push({
        displayName: 'Main File',
        type,
        priority: 'mainFile',
        path: `${pathroot}/${mainFile}`,
      });
    }
  };

  this.getMainFile = function () {
    const p = this.files.find((file) => file.priority === 'mainFile');
    if (p) {
      return p;
    }

    return {
      path: undefined,
    };
  };

  this.cleanObject = function () {
    const copy = { ...this };
    for (const x of Object.keys(copy)) {
      if (typeof copy[x] === 'function') {
        copy[x] = undefined;
      }
      if (this.localValues.includes(x)) {
        copy[x] = undefined;
      }
    }

    copy.localValues = undefined;

    if (copy.hosts && copy.hosts.curse) {
      copy.hosts.curse.localValues = undefined;
      copy.hosts.curse.versionCache = undefined;
    }

    copy.version.TEMP = undefined;
    copy.version.downloadTemp = undefined;
    copy.version.cachedID = undefined;
    copy.version.hosts = undefined;
    copy.downloadTemp = undefined;
    copy.cachedID = undefined;

    // not sure why this happens
    if (copy.dependencies.length === 1 && copy.dependencies[0] === undefined) {
      copy.dependencies = [];
    }
    return copy;
  };

  // ugh.. hosts...
  this.getPrimaryHost = function () {
    if (this.hosts.curse) {
      return 'curse';
    }

    return undefined;
  };
}
