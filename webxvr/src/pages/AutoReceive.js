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
import { SWTokenString, MyInfo, CltInfo } from '../skyway/skapp';

const tokenString = SWTokenString;

var newVideo = null;

var person; // for local state..

export default (props) => {
    const [videoStatus, setVideoStatus] = useState("");
    const [userVideo, SetUserVideo] = useState({});
    console.log("re-rendar:autoecv:");

    const addStatus = useCallback((st) => {
        const ss = st;
        console.log(ss);
        setVideoStatus(ss);
    }, [videoStatus]);


    useEffect(() => {
        doit();
        window.addEventListener('resize', onResize);
        return (async () => {
            console.log("Leave AutoReceive", person);
            if (person) {
                await person.leave();
            }
        });
    }, []);

    function onResize() {
        if (newVideo) {
            newVideo.setAttribute("width", "" + window.innerWidth - 10);
            newVideo.setAttribute("height", "" + window.innerHeight - 80);
        }
    }
    async function doit() {

        const remoteVideos = document.getElementById('auto-remote-streams');
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
            //            person = await channel.join({});

            person = await channel.join(
                { name: "Recv," + MyInfo + ","+uuidV4() } // unique name
            ).catch(error => console.log("Can't join",error));
            CltInfo("AutoRecv", person.id);

            addStatus("Joined:" + roomId);
            console.log(person);


            let bot = channel.bots.find((b) => b.subtype === SfuBotMember.subtype);
            if (!bot) {
                bot = await plugin.createBot(channel).catch((error)=>console.log("Can't create bot:",error));
            }

                // 新しいビデオが来たら
                person.onStreamSubscribed.add(async ({ stream, subscription }) => {
                    const publisherId = subscription.publication.origin.publisher.id;
                    console.log(stream, subscription);
                    addStatus("OnStream:");
                    if (stream instanceof RemoteDataStream) {
                        return;
                    }

                    if (!userVideo[publisherId]) {// 新しいビデオ！
                        newVideo = document.createElement('video');
                        newVideo.playsInline = true;
                        // mark peerId to find it later at peerLeave event
                        newVideo.setAttribute(
                            'data-member-id',
                            subscription.publication.publisher.id
                        );
                        const novideo = document.getElementById('novideo');
                        novideo.setAttribute("style", "visibility:hidden; height:0");

                        newVideo.autoplay = true;
                        remoteVideos.append(newVideo);
                        console.log("Appending!", newVideo);
                        const nnVideo = { ...userVideo };
                        nnVideo[publisherId] = newVideo;
                        SetUserVideo(nnVideo);// for React
                        stream.attach(newVideo);


                        onResize();


                        // キャンセルされたら、エレメントを消す
                        subscription.onCanceled.add(() => {
                            remoteVideos.removeChild(newVideo);
                            delete userVideo[publisherId];
                            const novideo = document.getElementById('novideo');
                            if (novideo){
                                novideo.setAttribute("style", "");
                            }
                        });

                    } else {
                        const newVideo = userVideo[publisherId];
                        stream.attach(newVideo);
                    }

                });

                person.onSubscriptionChanged.add(() => {
                    console.log("Subscription Changed:");
                    console.log(person.subscriptions);
                });

                const subscribe = async (publication) => {
                    if (publication.origin && publication.origin.publisher.id !== person.id) {
                        await person.subscribe(publication.id);
                    }
                };

                // 新しい publication を subscribe
                channel.onStreamPublished.add(async (e) => {
                    addStatus("OnStreamPublished!", e);
                    await subscribe(e.publication);
                });
                // 既存の　publication を subscribe
                channel.publications.forEach(async (p) => {
                    addStatus("OnStreamPublications!".p)
                    await subscribe(p);
                });

                channel.onMemberLeft.add((e) => {
                    //                addStatus("OnMemberLeft!",e);
                    if (e.member.id === person.id) return;
                    const remoteVideos = document.getElementById('auto-remote-streams');

                    const remoteVideo = remoteVideos.querySelector(
                        `[data-member-id="${e.member.id}"]`
                    );
                    if (remoteVideo) {
                        console.log("camera left", e);
                        const stream = remoteVideo.srcObject;
                        if (stream) {
                            stream.getTracks().forEach((track) => track.stop());
                        }
                        remoteVideo.srcObject = null;
                        remoteVideo.remove();
                        const novideo = document.getElementById('novideo');
                        if (novideo){
                            novideo.setAttribute("style", "");
                        }

                    } else {
                      //  console.log("remove not working");
                        //                    remoteVideos.innerHTML=null;
                    }
                });

                person.onLeft.once(() => {
                    console.log("I'm leaving!", person);
                    Array.from(remoteVideos.children).forEach((element) => {
                        const remoteVideo = element;
                        const stream = remoteVideo.srcObject;
                        if (stream) {
                            console.log("Stopping videos", stream);
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
                <Row>
                    <div id="auto-remote-streams" style={{ padding: 0 }}></div>
                    <div id="novideo">
                        <center> No Video yet. Sorry </center>
                    </div>
                </Row>
            </Container>
        </>
    );
};


