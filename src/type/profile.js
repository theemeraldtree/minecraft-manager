function Profile(rawOMAF) {
    Object.assign(this, rawOMAF);
    console.log(this.id);
}

export default Profile;