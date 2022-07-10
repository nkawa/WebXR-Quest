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
    MemberImpl,
} from '@skyway-sdk/core';

import { SfuBotMember, SfuClientPlugin } from '@skyway-sdk/sfu-client';

import TopNavi from '../components/TopNavi';

const appId = process.env.REACT_APP_SKYWAY_APPID;
const secretKey = process.env.REACT_APP_SKYWAY_SECRETKEY;

const webxvrTokenBase = {
    jti: uuidV4(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600,
    scope: {
        app: {
            id: appId,
            turn: true,
            actions: ['read'],
            channels: [
                {
                    id: '*',
                    name: '*',
                    actions: ['write'],
                    members: [
                        {
                            id: '*',
                            name: '*',
                            actions: ['write'],
                            publication: {
                                actions: ['write'],
                            },
                            subscription: {
                                actions: ['write'],
                            },
                        },
                    ],
                    sfuBots: [
                        {
                            actions: ['write'],
                            forwardings: [{ actions: ['write'] }],
                        },
                    ],
                },
            ],
        },
    },
};

const webxvrToken = new SkyWayAuthToken(webxvrTokenBase);
const tokenString = webxvrToken.encode(secretKey);


export default (props) => {
    const [videoStatus, setVideoStatus] = useState("None");
    const [Cam, setCam] = useState("None");
    const [CamList, setCamList] = useState([]);
    const [CamRawList, setCamRawList] = useState([]);
    const [Chan, SetChan] = useState({});
    const [Mem, SetMem] = useState({});

    console.log("re-rendar:SkywayClient");

    const addStatus = useCallback((st) => {
        const ss = videoStatus + "\n" + st;
        console.log(ss);
        setVideoStatus(ss);
    }, [videoStatus]);

    const changeForm = useCallback((e) => {
        console.log("OnChange Select:", e.target.value, Cam);
        setCam(e.target.value);
    }, [Cam]);


    async function doVideo(media) {
        //        console.log(media);
        //        const capabi = media.getCapabilities();
        //        console.log(capabi);

        const localVideo = document.getElementById('js-local-stream');

        const capabi = {
            deviceId: {
                exact: media.id
            }
        };

        const video = await SkyWayMediaDevices.createCameraVideoStream(capabi);
        console.log(video);
        video.attach(localVideo);
        localVideo.play().catch(console.error);
        addStatus("Working!");

        {
            console.log("CHan is",Chan);
            let bot = Chan.bots.find((b) => b.subtype === SfuBotMember.subtype);
            if (!bot) {
                bot = await plugin.createBot(Chan);
            }
            const publication = await Mem.publish(video);
            await bot.startForwarding(publication);
            addStatus("Do Forward!");
        }
    }


    const startCam = useCallback((e) => {
        //        console.log("Checking", Cam);
        const media = CamRawList[CamList.indexOf(Cam)];
        //        console.log("StartMedia", media,CamList, Cam, CamList.indexOf(Cam));
        doVideo(media);
        console.log("in stat", Chan);


    }, [Cam, CamList, CamRawList,Chan, Mem]);

    const plugin = new SfuClientPlugin();




    useEffect(() => {
        doit();
    }, []);

    async function doit() {
        const localVideo = document.getElementById('js-local-stream');
        const joinTrigger = document.getElementById('js-join-trigger');
        const leaveTrigger = document.getElementById('js-leave-trigger');
        const remoteVideos = document.getElementById('js-remote-streams');
        const roomId = document.getElementById('js-room-id');


        const context = await SkyWayContext.Create(tokenString, {
            logLevel: 'debug',
        });
        context.registerPlugin(plugin);

        console.log("doit work:SkywayClient");
        // 今回はビデオだけでOKなんだけど。
        //        const { audio, video } =
        //            await SkyWayMediaDevices.createMicrophoneAudioAndCameraStream();

        //        const devs0 = await SkyWayMediaDevices.enumerateDevices();
        //        console.log("EnumVideos", devs0);
        //        const displayStream = await navigator.mediaDevices.getDisplayMedia();
        //        console.log("dipStr",displayStream);
        //        const userStream = await navigator.mediaDevices.getUserMedia({video:true});
        //        console.log("usrStr",userStream);
        //        const displayTracks = userStream.getVideoTracks();
        //        console.log("dipTrk",displayTracks);




        // カメラ一覧を取得
        const devs = await SkyWayMediaDevices.enumerateInputVideoDevices();
        console.log("VideoDevs", devs);
        const cm = [];
        devs.map((md) => {
            cm.push(md.label);
        })
        setCamList(cm);
        setCam(cm[0]);
        setCamRawList(devs);
        //        setCam(cm[0]);

        //        console.log("Videos", devs);

        //      const { audio, video } =
        //            await SkyWayMediaDevices.createMicrophoneAudioAndCameraStream();

        localVideo.muted = true;
        localVideo.playsInline = true;
        /*
        if (navigator.userAgent.indexOf("OculusBrowser") <= 0) {
            video.attach(localVideo);
            await localVideo.play().catch(console.error);
            addStatus("Working!");
        } else {
            localVideo.innerText = "No video";

        }
        */



        // Register join handler

        joinTrigger.addEventListener('click', async () => {
            addStatus("Joining!");
            const channel = await SkyWayChannel.FindOrCreate(context, {
                name: roomId.value,
            });
            SetChan(channel);
            console.log("Chan!", channel);

            const member = await channel.join({});
            SetMem(member);

            const userVideo = {};

            member.onStreamSubscribed.add(async ({ stream, subscription }) => {
                const publisherId = subscription.publication.origin.publisher.id;
                var streamType = "Unknown";
                if (stream instanceof RemoteDataStream) {
                    streamType = "Data";
                } else if (stream instanceof LocalVideoStream) {
                    streamType = "LocalVideo";
                } else if (stream instanceof RemoteVideoStream) {
                    streamType = "RemoteVideo" + publisherId;
                }
                console.log(stream, subscription);
                addStatus("OnStream:" + streamType)
                if (stream instanceof RemoteDataStream) {
                    return;
                }

                // 

                if (!userVideo[publisherId]) {// 新しいビデオ！
                    const newVideo = document.createElement('video');
                    newVideo.playsInline = true;
                    // mark peerId to find it later at peerLeave event
                    newVideo.setAttribute(
                        'data-member-id',
                        subscription.publication.publisher.id
                    );
                    newVideo.autoplay = true;
                    remoteVideos.append(newVideo);
                    console.log("Appending!", newVideo);
                    userVideo[publisherId] = newVideo;
                }

                //                const newVideo = userVideo[publisherId];
                //                stream.attach(newVideo);
            });
            const subscribe = async (publication) => {

                if (publication.origin && publication.origin.publisher.id !== member.id) {
                    await member.subscribe(publication.id);
                }
            };
            channel.onStreamPublished.add(async (e) => {
                addStatus("OnStreamPublished!")

                await subscribe(e.publication);
            });
            channel.publications.forEach(async (p) => {
                addStatus("OnStreamPublications!")

                await subscribe(p);
            });
            // if video is set!
            /*
                        {
                            const publication = await member.publish(video);
                            await bot.startForwarding(publication);
                        }
                        */

            /*            {
                            const publication = await member.publish(audio);
                            await bot.startForwarding(publication);
                        }
              */

            channel.onMemberLeft.add((e) => {
                addStatus("OnMemberLeft!")

                if (e.member.id === member.id) return;

                const remoteVideo = remoteVideos.querySelector(
                    `[data-member-id="${e.member.id}"]`
                );
                if (remoteVideo){
                    const stream = remoteVideo.srcObject;
                    stream.getTracks().forEach((track) => track.stop());
                    remoteVideo.srcObject = null;
                    remoteVideo.remove();
                }
            });

            member.onLeft.once(() => {
                Array.from(remoteVideos.children).forEach((element) => {
                    const remoteVideo = element;
                    const stream = remoteVideo.srcObject;
                    stream.getTracks().forEach((track) => track.stop());
                    remoteVideo.srcObject = null;
                    remoteVideo.remove();
                });
                channel.dispose();
            });

            leaveTrigger.addEventListener(
                'click',
                async () => {
                    setVideoStatus("Leave")

                    await member.leave();
                },
                {
                    once: true,
                }
            );

        });


    }

    return (

        <>
            <TopNavi />
            <Container>
                <Row>
                    <Col xs={12} md={6}>
                        <Form.Select id="cam" value={Cam} onChange={changeForm} >
                            {CamList.map(c =>
                                <option key={c} value={c}>{c}</option>
                            )}
                        </Form.Select>
                    </Col>
                    <Col xs={12} md={4}>
                        <Button onClick={startCam}>
                            Start
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Col md={2}>
                        <video id="js-local-stream"></video>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <input type="text" placeholder="Room Name" id="js-room-id" />
                        <button id="js-join-trigger">Join</button>
                        <button id="js-leave-trigger">Leave</button>
                    </Col>
                </Row>

                <div id="js-remote-streams"></div>
                <br />
                <Col>
                    Logs:
                    <pre>
                        {videoStatus}
                    </pre>
                </Col>
            </Container>

        </>
    );
};



