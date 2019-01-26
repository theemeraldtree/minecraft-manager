import Global from "../util/global";
import LogManager from "./logManager";
import Profile from "../type/profile";
const path = require('path');
const fs = require('fs');

const ProfilesManager = {
    loadedProfiles: [],
    getProfiles: function() {
        return new Promise(resolve => {
            fs.readdir(Global.PROFILES_PATH, async (err, files) => {
                files.forEach(async (file) => {
                    await this.processProfileFolder(path.join(Global.PROFILES_PATH + file));
                    resolve();
                })
            })
        })
    },

    processProfileFolder: async function(location) {
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