function MinecraftAssetFile() {
    /**
     * File types are:
     *  cloud
     *  local
     * 
     * Host types:
     *  none
     *  curse
     * 
     * Path is either file path or URL
     */
    this.type, this.path, this.name, this.host;
    this.ids = {};
}

export default MinecraftAssetFile;