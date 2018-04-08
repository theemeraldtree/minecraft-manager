import Colors from '../../style/colors';
const ButtonColors = {
    getButtonColor: (color) => {
        switch(color) {
            case 'launch':
                return Colors.launch;
            case 'edit':
                return Colors.edit;
            case 'share':
                return Colors.share;
            case 'delete':
                return Colors.delete;
            case 'install':
                return Colors.add;
            case 'folder':
                return Colors.add;
            case 'update':
                return Colors.update;
            case 'add':
                return Colors.add;
            case 'save':
                return Colors.add;
            case 'file':
                return Colors.update;
            case 'color-blue':
                return Colors.share;
            case 'color-green':
                return Colors.add;
            case 'color-red':
                return Colors.delete;
        }
    }
}

export default ButtonColors;