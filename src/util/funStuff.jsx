class FunStuff {
    constructor() {
        this.deleteText = ["PLEASE DON'T DELETE ME!", "HAVE MERCY ON ME!!!", "NO PLEASE NO!!!", "NOOOOOOOOOOOO", "😭"]
    }
    getRandDeleteText() {
        return this.deleteText[Math.floor(Math.random()*this.deleteText.length)];
    }
}

export default new FunStuff();