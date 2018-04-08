import FileUtils from './fileUtils';
const fs = require('fs');
const path = require('path');
class UserSettings {
    constructor() {
        this.theme = 'dark';
        this.themeClass = `theme-${this.theme}`;
    }

    readOption = (optName) => {
        if(!FileUtils.isSetup()) {
            return '';
        }
        var json = JSON.parse(fs.readFileSync(path.join(FileUtils.getAppPath(), '/options.json')));
        return json[optName];
    }

    setOption = (optName, val) => {
        if(!FileUtils.isSetup()) {
            return '';
        }
        var json = JSON.parse(fs.readFileSync(path.join(FileUtils.getAppPath(), `/options.json`)));
        json[optName] = val;
        fs.writeFileSync(path.join(FileUtils.getAppPath(), `/options.json`), JSON.stringify(json));
    }
}

let settings = new UserSettings();
let themeClass = settings.themeClass;
export {themeClass, settings};
export default settings;