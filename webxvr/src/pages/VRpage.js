import { Container, Nav, Navbar} from 'react-bootstrap';
import { useEffect } from 'react';
import 

export default (props)=>{

    useEffect(()=>{
        if(navigator.xr){
            navigator.xr.isSessionSupported(XR_SESSION_STRING).then((supported)=>{
                isXRAvailable = supported;
                xrButton.enabled = supported;
                appendLog("isXRAvailable:" + supported);
            });
            navigator.xr.requestSession("inline").then(onSessionStarted);
        }

    },[]);


    return (
        <>

            <div id="xrview"></div>
            Can I wrote vr info?

        </>
    );
};


