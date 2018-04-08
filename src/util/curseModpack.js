function CurseModpack(obj) {
    this.name = obj.name;
    this.file = obj.file;
    this.id = obj.id;
    this.icon = obj.icon;
    this.type = obj.type;
    this.isFTB = obj.isFTB;
    this.curseFileId = obj.curseFileId;
    this.curseID = obj.curseID;
    this.epochDate = obj.epochDate;
    this.author = obj.author ? obj.author : 'Unknown developer';
    this.description = obj.description ? obj.description : 'No description available.'
}

export default CurseModpack;