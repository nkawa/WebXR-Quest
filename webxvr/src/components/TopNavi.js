import { Container, Nav, Navbar } from 'react-bootstrap';

export default (props) => {
    const ver = "v0.12";
    return (
            <Navbar bg="dark" variant="dark" expand="md">
            <Container>
            <Navbar.Brand href="/#/home"> WebXVR {ver} </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
{/*                    <Nav.Link href="/#/home"> Home </Nav.Link>
                    <Nav.Link href="/#/info"> Info </Nav.Link>
                    <Nav.Link href="/#/vr"> VR </Nav.Link>
                    <Nav.Link href="/#/flatVideo">flatVideo</Nav.Link>
                    <Nav.Link href="/#/autovr"> AutoVR </Nav.Link>
                    <Nav.Link href="/#/skyway"> Skyway </Nav.Link>
                    <Nav.Link href="/#/admin"> Admin </Nav.Link>
                    <Nav.Link href="/#/swrecv"> Recv </Nav.Link>
                    <Nav.Link href="/#/autosend"> AutoSend </Nav.Link>
    */}
                    <Nav.Link href="/#/home"> Home </Nav.Link>
                    <Nav.Link href="/#/threevr"> WithVR </Nav.Link>
                    <Nav.Link href="/#/autorecv"> Video </Nav.Link>

                </Nav>
                <Nav>
                    <Nav.Link href="https://ucl.nuee.nagoya-u.ac.jp"> UCLab HP </Nav.Link>
                    <Nav.Link href="https://www.youtube.com/channel/UCrf5seeEdvN-0XCEH5hTdfw"> YouTube Channel </Nav.Link>

                </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};
