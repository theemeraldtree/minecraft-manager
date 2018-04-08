import styled from 'styled-components';
const Page = styled.div`
    display: flex;
    flex-flow: column;
    height: 100%;
    overflow-x: hidden;
`

const Main = styled.div`
    display: flex;
    flex: 1 1 auto;
`
const Content = styled.div`
    width: 100%;
    display: flex;
    flex-flow: column;
`
const Options = styled.div`
    width: 100%;
    display: flex;
    flex-flow: column;
    height: 100%;
    overflow: hidden;
`
export { Content, Main, Options }
export default Page;