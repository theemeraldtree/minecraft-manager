import Global from "../util/global";
const path = require('path');

function Profile(rawOMAF) {
    Object.assign(this, rawOMAF);

    this.folderpath = path.join(Global.PROFILES_PATH + `/${this.id}`).replace("\\","/");
    this.iconpath = path.join(this.folderpath + `/${this.icon}`).replace(/\\/g,"/");
    console.log(this.iconpath);
}

export default Profile;