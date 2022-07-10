import { useEffect } from 'react';

import {
    SkyWayChannel,
    RemoteDataStream,
    SkyWayAuthToken,
    SkyWayContext,
    SkyWayMediaDevices,
    uuidV4,
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

async function doit() {
    const localVideo = document.getElementById('js-local-stream');
    const joinTrigger = document.getElementById('js-join-trigger');
    const leaveTrigger = document.getElementById('js-leave-trigger');
    const remoteVideos = document.getElementById('js-remote-streams');
    const roomId = document.getElementById('js-room-id');

    console.log("Navigator", navigator);
    const { audio, video } =
        await SkyWayMediaDevices.createMicrophoneAudioAndCameraStream();

    localVideo.muted = true;
    localVideo.playsInline = true;
    video.attach(localVideo);

    await localVideo.play().catch(console.error);

    const context = await SkyWayContext.Create(tokenString, {
        logLevel: 'debug',
      });
      const plugin = new SfuClientPlugin();
      context.registerPlugin(plugin);
    

    // Register join handler
    joinTrigger.addEventListener('click', async () => {
        const channel = await SkyWayChannel.FindOrCreate(context, {
            name: roomId.value,
        });
        const member = await channel.join({});

        let bot = channel.bots.find((b) => b.subtype === SfuBotMember.subtype);
        if (!bot) {
            bot = await plugin.createBot(channel);
        }

        const userVideo = {};

        member.onStreamSubscribed.add(async ({ stream, subscription }) => {
            if (stream instanceof RemoteDataStream) {
                return;
            }

            const publisherId = subscription.publication.origin.publisher.id;
            if (!userVideo[publisherId]) {
                const newVideo = document.createElement('video');
                newVideo.playsInline = true;
                // mark peerId to find it later at peerLeave event
                newVideo.setAttribute(
                    'data-member-id',
                    subscription.publication.publisher.id
                );
                newVideo.autoplay = true;
                remoteVideos.append(newVideo);
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
            await subscribe(e.publication);
        });
        channel.publications.forEach(async (p) => {
            await subscribe(p);
        });

        {
            const publication = await member.publish(video);
            await bot.startForwarding(publication);
        }
        {
            const publication = await member.publish(audio);
            await bot.startForwarding(publication);
        }

        channel.onMemberLeft.add((e) => {
            if (e.member.id === member.id) return;

            const remoteVideo = remoteVideos.querySelector(
                `[data-member-id="${e.member.id}"]`
            );
            const stream = remoteVideo.srcObject;
            stream.getTracks().forEach((track) => track.stop());
            remoteVideo.srcObject = null;
            remoteVideo.remove();
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
                await member.leave();
            },
            {
                once: true,
            }
        );
    });
}

export default (props) => {

    console.log(process.env);



    useEffect(() => {
        doit();
    }, []);



    return (

        <>
            <TopNavi />
            <div>
                <video id="js-local-stream"></video>
                <input type="text" placeholder="Room Name" id="js-room-id" />
                <button id="js-join-trigger">Join</button>
                <button id="js-leave-trigger">Leave</button>
            </div>
            <div id="js-remote-streams"></div>
        </>
    );
};


