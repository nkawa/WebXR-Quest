import { Container, Nav, Navbar} from 'react-bootstrap';
import { useEffect } from 'react';
import {Entity, Scene } from 'aframe-react';

export default (props)=>{

    useEffect(()=>{
        console.log("VR page loaded");
    },[]);


    return (
        <>
            <Scene>
                <Entity geometry={{primitive: 'box'}} material={{color:'red'}} position={{x:0, y:0, z:-5}} />
                <Entity particle-system={{preset: 'snow'}}/>
                <Entity light={{type: 'point'}}/>
                <Entity text={{value: 'Hello, WebXR!'}}/>
                <Entity primitive="a-sky" material="color: #ccc" />
            </Scene>
        </>
    );
};


