import { Container, Nav, Navbar} from 'react-bootstrap';
import TopNavi from '../components/TopNavi';
import stringifyObject from 'stringify-object';
import { stringify } from "javascript-stringify";

export default (props)=>{

    console.log("Navigator",navigator);
return (
    <>

        <TopNavi />
        {stringifyObject(navigator.userAgent)}
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


