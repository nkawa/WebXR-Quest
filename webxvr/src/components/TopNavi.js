import { Container, Nav, Navbar } from 'react-bootstrap';

export default (props) => {
    return (
            <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
            <Navbar.Brand href="#home"> WebXVR </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Link href="home"> Home </Nav.Link>
                    <Nav.Link href="/#/info"> Info </Nav.Link>
                    <Nav.Link href="/#/vr"> VR </Nav.Link>
                    <Nav.Link href="/#/skyway"> Skyway </Nav.Link>
                </Nav>
            </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};
