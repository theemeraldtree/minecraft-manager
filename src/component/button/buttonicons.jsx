import styled from 'styled-components';
import launch from './img/launch.png';
import edit from './img/edit.png';
import share from './img/share.png';
import deleteImg from './img/delete.png';
import add from './img/add.png';
import folder from './img/folder.png';
import update from './img/update.png';
import save from './img/save.png';
import file from './img/file.png';
const getIconURL = (icon) => {
    switch(icon) {
        case 'launch':
            return launch;
        case 'edit':
            return edit;
        case 'share':
            return share;
        case 'delete':
            return deleteImg;
        case 'install':
            return add;
        case 'folder':
            return folder;
        case 'update':
            return update;
        case 'add':
            return add;
        case 'save':
            return save;
        case 'file':
            return file;
    }
}
const ButtonIcon = styled.div`
    background-image: url(${props => getIconURL(props.icon)});
`

export default ButtonIcon;