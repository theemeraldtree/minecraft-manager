import Card from '../card/card';
import styled from 'styled-components';
import IconButton from '../button/iconbutton/iconbutton';
const Wrapper = styled(Card)`
    height: 200px;
    cursor: pointer;
    width: 450px;
    transition: 150ms ease-in-out;
    margin: 10px;
    white-space: nowrap;
    position: relative;
    &:hover {
        transition: 150ms;
        box-shadow: 0px 0px 40px 8px rgba(0, 0, 0, 0.75);
    }
`
const Popup = styled.div`
    position: absolute;
    top: 210px;
    left: 0;
    z-index: 30;
    width: 100%;
    box-shadow: 0 10px 26px -4px rgba(0, 0, 0, 0.69);
    cursor: default;
    border-radius: 0 0 15px 15px;
    background-color: #771202;
`
const PopupTitle = styled.p`
    text-align: center;
    color: white;
    font-weight: bold;
`
const PopupDesc = styled.p`
    color: white;
    margin-left: 10px;
    white-space: normal;
`
const PopupCloseButton = styled.div`
    cursor: pointer;
    text-align: center;
    &:hover {
        transition: background-color 300ms;
        background-color: #470700;
    }
    background-color: #660a01;
    transition: background-color 300ms;
    border-radius: 0 0 15px 15px;
    color: white;
`
const ImgContainer = styled.div`
    width: 103px;
    height: 103px;
    position: absolute;
    border-radius: 13px;
    display: flex;
    left: 5px;
    flex-direction: column;
    justify-content: center;
    border: 3px solid #282828;
`
const Img = styled.img`
    width: 100%;
    border-radius: 10px;
    max-height: 103px;
`
const Title = styled.p`
    position: absolute;
    top: 10px;
    left: 120px;
    color: white;
    font-size: 20pt;
    overflow-x: hidden;
    text-overflow: ellipsis;
    width: 340px;
    margin: 0;
`
const Desc = styled.p`
    color: #c6c6c6;
    position: absolute;
    top: 30px;
    left: 120px;
    width: 340px;
    white-space: normal;
    font-size: 15pt;
    height: 130px;
    overflow: hidden;
`
const Badges = styled.div`
    position: absolute;
    bottom: 10px;
    right: 10px;
`
const Buttons = styled.div`
    position: absolute;
    bottom: 10px;
    left: 5px;
`
const LoadingText = styled.p`
    color: #079e0f;
    font-weight: bolder;
    font-size: 20pt;
    margin: 0;
    margin-left: 8px;
`
const CustomButton = styled(IconButton)`
    margin-left: 10px;
`

export { Wrapper, Popup, PopupTitle, PopupDesc, PopupCloseButton, ImgContainer, Img, Title, Desc, Badges, Buttons, LoadingText, CustomButton };