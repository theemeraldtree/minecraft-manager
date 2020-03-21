export default class OAMFAsset {
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
    datapacks
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
      datapacks
    } = this;

    return {
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
      datapacks
    };
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
