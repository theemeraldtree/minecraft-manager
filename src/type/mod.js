function Mod(rawOMAF) {
    Object.assign(this, rawOMAF);

    if(!this.hosts) {
        this.hosts = {};
    }

    this.local = ['detailedInfo', 'cachedID', 'iconpath', 'versions', 'downloadTemp']
}

Mod.prototype.cleanObject = function() {
    let copy = Object.assign({}, this);
    for(let i of this.local) {
        copy[i] = undefined;
    }

    if(this.dependencies) {
        for(let depend of this.dependencies) {
            for(let i of this.local) {
                depend[i] = undefined;
            }

            depend.local = undefined;
        }
    }

    if(this.hosts) {
        if(this.hosts.curse) {
            if(this.hosts.curse.localValues) {
                copy.hosts.curse.localValues = undefined;
            }
        }
    }
    copy.local = undefined;
    return copy;
}

export default Mod;