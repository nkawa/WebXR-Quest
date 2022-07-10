import { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

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
    const [Mem, SetMem] = useState(null);
    console.log("re-rendar:autoecv:" + videoStatus);

    const addStatus = useCallback((st) => {
        const ss = videoStatus + "\n" + st;
        console.log(ss);
        setVideoStatus(ss);
    }, [videoStatus]);


    useEffect(() => {
        doit();
        return (() => {
            console.log("Leave AutoReceive",Mem);

//            Mem.leave();
        });
    }, []);

    async function doit() {
        //        const joinTrigger = document.getElementById('js-join-trigger');
        //        const leaveTrigger = document.getElementById('js-leave-trigger');
        //        const roomId = document.getElementById('js-room-id');

        const remoteVideos = document.getElementById('js-remote-streams');
        const roomId = "uclab-xvr";

        console.log("doit:swrecv", remoteVideos);

        const context = await SkyWayContext.Create(tokenString, {
            logLevel: 'debug',
        });
        const plugin = new SfuClientPlugin();
        context.registerPlugin(plugin);
        // Register join handler
        const startListen = async () => {
            addStatus("Joining!" + roomId);
            const channel = await SkyWayChannel.FindOrCreate(context, {
                name: roomId,
            });
            const member = await channel.join({});
            SetMem(member);
            addStatus("Joined:" + roomId);

            let bot = channel.bots.find((b) => b.subtype === SfuBotMember.subtype);
            if (!bot) {
                bot = await plugin.createBot(channel);
            }

            const userVideo = {};

            member.onStreamSubscribed.add(async ({ stream, subscription }) => {
                const publisherId = subscription.publication.origin.publisher.id;
                console.log(stream, subscription);
                addStatus("OnStream:" );
                if (stream instanceof RemoteDataStream) {
                    return;
                }

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

                const newVideo = userVideo[publisherId];
                stream.attach(newVideo);
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

            channel.onMemberLeft.add((e) => {
                addStatus("OnMemberLeft!")

                if (e.member.id === member.id) return;
                const remoteVideos = document.getElementById('js-remote-streams');

                const remoteVideo = remoteVideos.querySelector(
                    `[data-member-id="${e.member.id}"]`                    
                );
                if (remoteVideo){
                    const stream = remoteVideo.srcObject;
                    if(stream){
                        stream.getTracks().forEach((track) => track.stop());
                    }
                    remoteVideo.srcObject = null;
                    remoteVideo.remove();
                }else{
                    console.log("remove");
                    remoteVideos.innerHTML=null;
                }
            });

            member.onLeft.once(() => {
                Array.from(remoteVideos.children).forEach((element) => {
                    const remoteVideo = element;
                    const stream = remoteVideo.srcObject;
                    if (stream ){
                        stream.getTracks().forEach((track) => track.stop());
                    }
                    remoteVideo.srcObject = null;
                    remoteVideo.remove();
                });
                channel.dispose();
            });

        };

        // timer
        startListen();

    }


    return (

        <>
            <TopNavi />
            <Container fluid>
                <Row >
                    {/*                   <Col>
                        <input type="text" placeholder="Room Name" id="js-room-id" />
                        <button id="js-join-trigger">Join</button>
                        <button id="js-leave-trigger">Leave</button>
                    </Col>
*/}                </Row>

                <Row>
                    <div id="js-remote-streams"></div>
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


