import { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

import {
    SkyWayChannel,
    RemoteDataStream,
    RemoteVideoStream,
    SkyWayAuthToken,
    SkyWayContext,
    SkyWayMediaDevices,
    uuidV4,
    LocalVideoStream,
} from '@skyway-sdk/core';

import { SfuBotMember, SfuClientPlugin } from '@skyway-sdk/sfu-client';

import TopNavi from '../components/TopNavi';

import { SWTokenString, MyInfo,CltInfo } from '../skyway/skapp';

let myVideo = null;
let channel = null;
let person = null;
let publication = null;

export default (props) => {
    const [videoStatus, setVideoStatus] = useState("");
    const [Cam, setCam] = useState("None");
    const [CamList, setCamList] = useState([]);
    const [CamRawList, setCamRawList] = useState([]);

    console.log("re-rendar:autoSend:" + videoStatus);

    const addStatus = useCallback((st) => {
        const ss = videoStatus + "\n" + st;
        console.log(ss);
        setVideoStatus(ss);
    }, [videoStatus]);


    useEffect(() => {
        doit();
        return (async () => {
            console.log("Leave AutoSend",person);
            if(person){
                await person.leave();
                person = null;
            }
        });
    }, []);

    // メディア情報を変更
    const changeForm = useCallback((e) => {
        console.log("OnChange Select:", e.target.value, Cam);
        setCam(e.target.value);
    }, [Cam]);
    

    async function doVideo(media) {
        const localVideo = document.getElementById('js-local-stream');

        // 特定のカメラのケイパビリティを指定
        const capabi = {
            video: {
                width:{min:1920,ideal:1920,max:1920 },
                height:{min:1080,ideal:1080,max:1080}
//                width:{min:640,ideal:1920,max:1920 },
//                height:{min:480,ideal:1080,max:1080}
            },
            deviceId: {
                exact: media.id
            }
        };

        myVideo = await SkyWayMediaDevices.createCameraVideoStream(capabi);
        myVideo.attach(localVideo);
        localVideo.play().catch(console.error);
        console.log("Attached", localVideo);
        addStatus("Working!");

        { // チャンネル (join していないと動かない)
            let bot = null;
            if (channel){
                bot = channel.bots.find((b) => b.subtype === SfuBotMember.subtype);
                if (channel & !bot) {
                    bot = await plugin.createBot(channel);
                }
            }else{
                console.log("Chan null",channel );
            }
            if (bot){
                if (!publication){
                    publication = await person.publish(myVideo,{
                        codecCapabilities: [{ mimeType: 'video/av1' }, { mimeType: 'video/h264' }], // コーデックが指定できる！
                        encodings: [
                            // 複数のパラメータをセットする
//                            { maxBitrate: 10_000, scaleResolutionDownBy: 8 },
//                            { maxBitrate: 40_000, scaleResolutionDownBy: 2 },  
                            { maxBitrate: 680_000, scaleResolutionDownBy: 1 },
                          ],
                    }); // ここで publish
                    await bot.startForwarding(publication);
                    addStatus("Do Forward!");        
                }
            }
        }
    }


    const startCam = useCallback(async (e) => {
        console.log("Click", e.target);
        if (e.target.innerText == "Stop"){
            const localVideo = document.getElementById('js-local-stream');
            console.log("Stopiing!", localVideo);
            // video の止め方
            localVideo.pause();

            myVideo.detach(); //
            myVideo.release(); // release media
            myVideo = null;


            await publication.cancel();
            publication = null;
            // 送信 (publish を止めたい）
            // 同時に bot を停める必要がある。

            const videoParent = document.getElementById('js-video-parent');
            videoParent.removeChild(localVideo);
            const videoNew = document.createElement("video");
            videoNew.setAttribute('id','js-local-stream');
            videoParent.appendChild(videoNew);
            e.target.innerText = "Start";
        }else{ // Video start!
            const media = CamRawList[CamList.indexOf(Cam)];
            doVideo(media);
            console.log("in start Channel", channel);
            e.target.innerText = "Stop";
            // need to keep alive?
        }
    }, [Cam, CamList, CamRawList]);

    const plugin = new SfuClientPlugin();

    async function doit() {
        const roomId = "uclab-xvr";
        console.log("doit:autoSend");

        const devs = await SkyWayMediaDevices.enumerateInputVideoDevices();
        console.log("VideoDevs", devs);
        const cm = [];
        devs.map((md) => {
            cm.push(md.label);
        })
        setCamList(cm);
        setCam(cm[0]); //　ここで、設定してあるカメラを選べるとベスト！
        setCamRawList(devs);

        const context = await SkyWayContext.Create(SWTokenString, {
            logLevel: 'debug',
        });
        context.registerPlugin(plugin);
      

        // Register join handler
        const startListen = async () => {
            addStatus("Joining!" + roomId);
            channel = await SkyWayChannel.FindOrCreate(context, {
                name: roomId,
            });
            person = await channel.join({name:"Send,"+MyInfo+","+uuidV4()}
            ).catch(error =>{console.log("Can't join",error)});
            CltInfo("AutoSend", person.id);

            addStatus("Joined:" + roomId);
        };
        await startListen();

    }


    return (

        <>
            <TopNavi />
            <Container fluid>
            <Row>
                    <Col xs={12} md={6}>
                        <Form.Select id="cam" value={Cam} onChange={changeForm} >
                            {CamList.map(c =>
                                <option key={c} value={c}>{c}</option>
                            )}
                        </Form.Select>
                    </Col>
                    <Col xs={12} md={4}>
                        <Button onClick={startCam} >
                            Start
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Col md={2}>
                        <div id="js-video-parent">
                            <video id="js-local-stream"></video>
                        </div>
                    </Col>
                </Row>
                <br />
                <Row>
                    <Col>
                        Logs:
                        <pre>
                            {videoStatus}
                        </pre>
                    </Col>
                </Row>
            </Container>
        </>
    );
};


