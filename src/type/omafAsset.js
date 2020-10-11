// Fun fact: this class sat for 7 months with a typo of "OAMFAsset" and I didn't notice
export default class OMAFAsset {
  /**
   * Base Minecraft Asset
   * @param {Object} json - The JSON object this asset is being created from
   */
  constructor({
    type,
    id,
    name,
    icon,
    blurb,
    description,
    omafVersion,
    version,
    hosts = {},
    cachedID,
    dependencies,
    frameworks,
    files,
    datapacks,
    iconURL,
    iconPath,
    mcm
  }) {
    this.omafVersion = omafVersion;
    this.type = type;
    this.id = id;
    this.name = name;
    this.blurb = blurb;
    this.description = description;
    this.version = version;
    this.hosts = hosts;
    this.icon = icon;
    this.cachedID = cachedID;

    if (type !== 'profile') {
      this.dependencies = dependencies;
      this.files = files;
    } else {
      this.frameworks = frameworks;
    }

    if (type === 'world') {
      this.datapacks = datapacks;
    }

    // this solely exists out of laziness
    this.iconURL = iconURL;
    this.iconPath = iconPath;

    // local mcm values (used for mcm-only stuff like profile syncing)
    this.mcm = mcm;
  }

  /**
   * Converts the current OMAFAsset to JSOn
   * @returns {Object} The OMAFAsset as a JSON Object
   */
  toJSON() {
    const {
      omafVersion,
      type,
      id,
      name,
      blurb,
      description,
      version,
      hosts,
      icon,
      dependencies,
      files,
      frameworks,
      datapacks,
      mcm
    } = this;

    const returnObject = {
      omafVersion,
      type,
      id,
      name,
      version,
      hosts,
      icon,
      blurb,
      description,
      dependencies,
      files,
      frameworks,
      datapacks,
      mcm
    };

    // Cleanup regarding local values on hosts
    if (returnObject.hosts?.curse) {
      returnObject.hosts.curse.localValues = undefined;
      returnObject.hosts.curse.versionCache = undefined;
      returnObject.hosts.curse.latestFileID = undefined;
    }

    // Cleanup regarding local values on versions
    if (returnObject.version) {
      returnObject.version.TEMP = undefined;
      returnObject.version.cachedID = undefined;
      if (returnObject.version.hosts && returnObject.version.hosts.curse) {
        returnObject.version.hosts.curse.localValues = undefined;
      }
    }

    return returnObject;
  }

  /**
   * Returns the "primary" host
   * As of now the only host is Curse so it's not really needed
   * @returns {string} The Primary Host
   */
  getPrimaryHost() {
    if (this.hosts.curse) return 'curse';

    return undefined;
  }
}
