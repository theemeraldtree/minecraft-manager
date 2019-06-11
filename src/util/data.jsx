import path from 'path'
import FileUtils from './fileUtils'
const os = require("os");
const fs = require('fs');
const Data = {
    saveOption(optName, val, callback)  {
        if(!fs.existsSync(path.join(FileUtils.getAppPath(), '/options.json'))) {
            fs.writeFileSync(path.join(FileUtils.getAppPath(), '/options.json'), '{}')
        }
        console.log(val);
        var json = JSON.parse(fs.readFileSync(path.join(FileUtils.getAppPath(), '/options.json')));
        json[optName] = val;
        console.log(json);
        fs.writeFile(path.join(FileUtils.getAppPath(), '/options.json'), JSON.stringify(json), () => {
            if(callback != null) {
                callback();
            }
        });
    },

    getJavaRuntime() {
      if(os.platform() === "win32") {
          return path.join("C:\\Program Files (x86)\\Minecraft\\runtime\\jre-x64\\1.8.0_25\\bin\\java.exe");
      }else if(os.platform() === "darwin") {
          return path.join("/Applications/Minecraft.app/Contents/runtime/jre-x64/1.8.0_25/bin/java");
      }
    },
    createId(name) {
        return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9]/g, "-").replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/gi, '-').toLowerCase()
    },
    getMCMVersion() {
        return 'MCM-R1.2.1'
    },
    getMCMDate() {
        return '2018-07-11'
    },
    createVersionName(name) {
        return name.replace(/[^a-zA-Z]/g, '');
    },
    getMCMIcon() {
        return path.join(FileUtils.getAppPath(), `/resource/mcm-icon.png`);
    }
}

export default Data;