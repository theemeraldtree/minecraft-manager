function Mod(rawOMAF) {
    Object.assign(this, rawOMAF);

    if(!this.hosts) {
        this.hosts = {};
    }

    this.local = ['detailedInfo', 'cachedID', 'iconpath', 'versions']
}

Mod.prototype.cleanObject = function() {
    let copy = Object.assign({}, this);
    for(let i of this.local) {
        copy[i] = undefined;
    }
    copy.local = undefined;
    return copy;
}

export default Mod;