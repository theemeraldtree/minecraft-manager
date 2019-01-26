import Global from "../util/global";
import LogManager from "./logManager";
import Profile from "../type/profile";
const path = require('path');
const fs = require('fs');

const ProfilesManager = {
    loadedProfiles: [],
    getProfiles: function() {
        fs.readdir(Global.PROFILES_PATH, (err, files) => {
            files.forEach((file) => {
                this.processProfileFolder(path.join(Global.PROFILES_PATH + file));
            })
        })
    },

    processProfileFolder: function(location) {
        let profilePath = path.join(location, '/profile.json')
        if(fs.existsSync(profilePath)) {
            let rawOMAF = JSON.parse(fs.readFileSync(profilePath));

            let profile = new Profile(rawOMAF);
            this.loadedProfiles.push(profile);
        }else{
            LogManager.log('SEVERE', `Error: Profile at path ${location} DOES NOT CONTAIN a profile.json file! The profile is probably improperly imported or created! Fix this now, as furthur imports of this profile will not work!`)
        }
    }
}

export default ProfilesManager;