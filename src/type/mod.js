function Mod(rawOMAF) {
    Object.assign(this, rawOMAF);

    if(!this.hosts) {
        this.hosts = {};
    }

    if(!this.files) {
        this.files = [];
    }
    this.local = ['installed', 'detailedInfo', 'cachedID', 'iconpath', 'versions', 'downloadTemp', 'primaryHost'];

    this.getPrimaryHost();
}

Mod.prototype.getPrimaryHost = function() {
    if(this.hosts.curse) {
        this.primaryHost = 'curse'
    }

    return this.primaryHost;
}

Mod.prototype.setJARFile = function(newJarFile) {
    let existing;
    for(let file of this.files) {
        if(file.type === 'jar' && file.priority === 'mainFile') {
            existing = file;
        }
    }

    if(existing) {
        existing.path = newJarFile;
    }else{
        this.files.push({
           displayName: 'Main JAR File',
           type: 'jar',
           priority: 'mainFile',
           path: newJarFile
        })
    }
}

Mod.prototype.getJARFile = function() {
    for(let file of this.files) {
        if(file.type === 'jar' && file.priority === 'mainFile') {
            return file;
        }
    }
    return {
        path: undefined
    }
}

Mod.prototype.cleanObject = function() {
    let copy = Object.assign({}, this);
    for(let i of this.local) {
        copy[i] = undefined;
    }

    if(this.dependencies) {
        for(let depend of this.dependencies) {
            if(depend) {
                for(let i of this.local) {
                    if(depend) {
                        depend[i] = undefined;
                    }
                }
                
    
                depend.local = undefined;
            }
        }
    }

    if(this.version) {
        if(this.version.TEMP) {
            this.version.TEMP = undefined;
        }
    }
    if(this.hosts) {
        if(this.hosts.curse) {
            if(this.hosts.curse.localValues) {
                copy.hosts.curse.localValues = undefined;
            }
            
            copy.hosts.curse.versionCache = undefined;
        }
    }
    copy.local = undefined;
    return copy;
}

export default Mod;