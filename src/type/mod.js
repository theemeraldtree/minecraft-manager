function Mod(rawOMAF) {
    Object.assign(this, rawOMAF);

    if(!this.hosts) {
        this.hosts = {};
    }
}

export default Mod;