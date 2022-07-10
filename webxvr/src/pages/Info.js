import { Container, Nav, Navbar} from 'react-bootstrap';
import TopNavi from '../components/TopNavi';
import stringifyObject from 'stringify-object';
import { stringify } from "javascript-stringify";
import { useEffect,useState } from 'react';

export default (props)=>{

    const [browser, setBrowser] = useState("");


    const check =()=>{
        if (navigator.userAgent.indexOf("OculusBrowser")>=0){
            setBrowser("Oculus!");            
        }else{
            setBrowser("Others");
        }
    }

    useEffect(()=>{
        check()
    },[])

    console.log("Navigator",navigator);
return (
    <>

        <TopNavi />
        {browser}
        <br />
        <hr />
        {stringify(navigator.userAgent)}
        <hr />
        navigator.MediaDevices : is null: {stringify(navigator.mediaDevices==null)}<br />
        navigator.MediaDevices{ (navigator.mediaDevices!=null?
            stringify(navigator.mediaDevices.enumerateDevices().then((dev)=>console.log(dev))):"none")
        }
     </>
);
};


