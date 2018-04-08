const Colors = {
    windowbar: '#444444',
    card: '#005b7f',
    curse: '#f26522',
    launch: '#20cc45',
    edit: '#cece18',
    share: '#3e79d8',
    delete: '#bc1909',
    update: '#8d30b2',
    add: '#047504',
    navbar: '#363636',
    green: this.launch,
    getColor: (color) => {
        switch(color) {
            case 'orange':
                return Colors.curse;
            case 'green':
                return Colors.launch;
            case 'purple':
                return Colors.update;
            case 'blue':
                return Colors.share;
            case 'red':
                return Colors.delete;
            case 'yellow':
                return Colors.edit;
            default:
                break;
        }
    }
}

export default Colors;