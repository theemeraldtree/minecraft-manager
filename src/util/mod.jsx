import MinecraftAsset from "./minecraftAsset";
import MinecraftAssetVersion from "./minecraftAssetVersion";
import MinecraftAssetFile from "./minecraftAssetFile";

class Mod extends MinecraftAsset {
    constructor(object) {
        super(object);
    }

    extraSetup(object) {
        if(!object.formatversion) {
            // convert format version
            object.filename = object.file;
            object.ids.mcm = object.id;
            object.ids.curse = object.curseID;
            object.versions = [];
            object.iconpath = object.icon;
            
            let ver = new MinecraftAssetVersion();
            ver.name = object.version;
            ver.ids.curse = object.curseFileId;
            ver.date = object.epochDate;

            let file = new MinecraftAssetFile();
            file.ids.curse = object.curseFileId;
            file.name = object.filename;

            if(object.type === 'curse') {
                file.type = 'cloud';
                file.host = 'curse'
            }else{
                file.type = 'local'
            }

            ver.file = file;
            object.versions.push(ver);
        }
    }

    setup(obj) {
        this.name = obj.name;
        this.file = obj.file;
        this.id = obj.id;
        this.icon = obj.icon;
        this.type = obj.type ? obj.type : 'curse';
        this.curseFileId = obj.curseFileId;
        this.curseID = obj.curseID;
        this.version = obj.version ? obj.version : 'Unknown version';
        this.epochDate = obj.epochDate;
        this.author = obj.author ? obj.author : 'Unknown developer';
        this.description = obj.description ? obj.description : 'No description available.'
    }
}

export default Mod;