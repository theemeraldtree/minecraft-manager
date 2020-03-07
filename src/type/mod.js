export default function Mod(rawoamf) {
  Object.assign(this, rawoamf);

  this.localValues = ['installed', 'iconPath', 'iconURL'];

  this.checkMissing = function() {
    if (!this.hosts) {
      this.hosts = {};
    }

    if (!this.files) {
      this.files = [];
    }
  };

  this.checkMissing();

  // useful functions

  this.cleanObject = function() {
    const copy = { ...this }.map(x => {
      if (typeof x !== 'function' && !this.localValues.includes(x)) return x;

      return undefined;
    });

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

  this.setJARFile = function(newJARFile) {
    const existing = this.files.find(file => file.type === 'jar' && file.priority === 'mainFile');

    if (existing) {
      existing.path = `mods/${newJARFile}`;
    } else {
      this.files.push({
        displayName: 'Main JAR File',
        type: 'jar',
        priority: 'mainFile',
        path: `mods/${newJARFile}`
      });
    }
  };

  this.getJARFile = function() {
    const file = this.files.find(f => f.type === 'jar' && f.priority === 'mainFile');
    if (file) return file;

    return {
      path: undefined
    };
  };

  // ugh.. hosts...
  this.getPrimaryHost = function() {
    if (this.hosts.curse) {
      return 'curse';
    }

    return undefined;
  };
}
