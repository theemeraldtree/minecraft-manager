function Mod(obj) {
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

export default Mod;