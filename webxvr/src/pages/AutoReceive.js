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
import { SWTokenString , MyInfo} from '../skyway/skapp';

const tokenString =SWTokenString;

var person; // for local state..

export default (props) => {
    const [videoStatus, setVideoStatus] = useState("None");
    const [userVideo, SetUserVideo] = useState({});
    console.log("re-rendar:autoecv:" + videoStatus);

    const addStatus = useCallback((st) => {
        const ss = videoStatus + "\n" + st;
        console.log(ss);
        setVideoStatus(ss);
    }, [videoStatus]);


    useEffect(() => {
        doit();
        return (async () => {
            console.log("Leave AutoReceive",person);
            if (person){
                await person.leave();
            }
        });
    }, []);

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
            person = await channel.join({name:MyInfo+","+window.navigator.userAgent});

            addStatus("Joined:" + roomId);

            let bot = channel.bots.find((b) => b.subtype === SfuBotMember.subtype);
            if (!bot) {
                bot = await plugin.createBot(channel);
            }

            // 新しいビデオが来たら
            person.onStreamSubscribed.add(async ({ stream, subscription }) => {
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
                    const nnVideo = {...userVideo};
                    nnVideo[publisherId] = newVideo;
                    SetUserVideo(nnVideo);// for React
                    stream.attach(newVideo);

                    // キャンセルされたら、エレメントを消す
                    subscription.onCanceled.add(()=>{
                        remoteVideos.removeChild(newVideo);
                        delete userVideo[publisherId];
                    });
                    
                }else{
                    const newVideo = userVideo[publisherId];
                    stream.attach(newVideo);
                }

            });

            person.onSubscriptionChanged.add(()=>{
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
                addStatus("OnStreamPublished!",e);
                await subscribe(e.publication);
            });
            // 既存の　publication を subscribe
            channel.publications.forEach(async (p) => {
                addStatus("OnStreamPublications!".p)
                await subscribe(p);
            });

            channel.onMemberLeft.add((e) => {
//                addStatus("OnMemberLeft!",e);
                console.log("on member left",e);
                if (e.person.id === person.id) return;
                const remoteVideos = document.getElementById('auto-remote-streams');

                const remoteVideo = remoteVideos.querySelector(
                    `[data-member-id="${e.person.id}"]`                    
                );
                if (remoteVideo){
                    const stream = remoteVideo.srcObject;
                    if(stream){
                        stream.getTracks().forEach((track) => track.stop());
                    }
                    remoteVideo.srcObject = null;
                    remoteVideo.remove();
                }else{
                    console.log("remove not working");
//                    remoteVideos.innerHTML=null;
                }
            });

            person.onLeft.once(() => {
                console.log("I'm leaving!",person);
                Array.from(remoteVideos.children).forEach((element) => {
                    const remoteVideo = element;
                    const stream = remoteVideo.srcObject;
                    if (stream ){
                        console.log("Stopping videos",stream);
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
            <Container>
                <Row>
                    <div id="auto-remote-streams"></div>
                </Row>
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


