class MinecraftAsset {
    constructor(object) {
        this.name, this.version, this.installed, this.type, this.filename, this.description, this.detailedDescription, this.iconpath, this.url;
        this.versions = [];
        this.ids = {};
        if(object) {
            this.setup(object);
        }
    }

    // eslint-disable-next-line no-unused-vars
    extraSetup(object) {}

    setup(object) {
        /**
         * Sets the variables of the current instance to match the object
         * Object follows the MCM Minecraft Asset Standards:
         * 
         * name: STRING
         * version: VERSION.NAME
         * type: ASSET TYPE (mod, profile, resourcepack, savegame)
         * filename: STRING
         * authors: ARRAY [ STRING ]
         * versions: ARRAY [ VERSION ]
         * ids: OBJECT { HOST: ID }
         * formatversion: STRING
         */
        let neededChanges = [];
        
        this.extraSetup(object);

        if(!object.formatversion) {
            // No format version!
            neededChanges.push("upgrade_version");
            object.formatversion = 1;
        }
        if(object.formatversion === 1) {
            // Format version 1
            this.name = object.name;
            this.versions = object.versions;
            this.type = object.type;
            this.filename = object.filename
            this.ids = object.ids;
            this.version = object.version;
            this.description = object.description;
            this.detailedDescription = object.detailedDescription;
            this.iconpath = object.iconpath;
        }

        return neededChanges;
    }
}

export default MinecraftAsset;