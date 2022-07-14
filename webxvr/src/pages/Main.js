import { Container, Nav, Navbar} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import TopNavi from '../components/TopNavi';

export default (props)=>{

return (
    <>
    <TopNavi />
    <Container>
    <br />
    <center>
        <h2>
    ようこそWebXVRへ！
    </h2>
    <h3>
    <br />　ここでは、VR 空間を多人数で共有するデモを行います。
    </h3>    </center>
        <br />
    <center>   ↑ VR で見るには「WithVR」を選択</center>
    <br />
    <center> 　　　  ↑ ブラウザで見るには「Video」を選択 (スマホもOK)
    <br />
    <br />
　　　Video で「No Video yet. Sorry」と表示され、画像が出ない場合は配信が停止中です。<br />
お待ちください。
<br />
<br />
　　　表示が消えても真っ白のままの場合は、一度、"Home"を押してから、"Video" に戻ってみてください。
<br />
ちなみに、Android でも VRに対応している機器がありますので、お試しください。<br /><br />
 <img src="/qrcode.png"></img>
  
</center>
</Container>
    </>
);
};


