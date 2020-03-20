export default class OAMFAsset {
  /**
   * Base Minecraft Asset
   * @param {Object} json - The JSON object this asset is being created from
   */
  constructor({ type, id, name, icon, blurb, description, omafVersion, version, hosts }) {
    this.omafVersion = omafVersion;
    this.type = type;
    this.id = id;
    this.name = name;
    this.blurb = blurb;
    this.description = description;
    this.version = version;
    this.hosts = hosts;
    this.icon = icon;
  }

  /**
   * Converts the current OMAFAsset to JSOn
   * @returns {Object} The OMAFAsset as a JSON Object
   */
  toJSON() {
    const { omafVersion, type, id, name, blurb, description, version, hosts, icon } = this;

    return {
      omafVersion,
      type,
      id,
      name,
      version,
      hosts,
      icon,
      blurb,
      description
    };
  }
}
