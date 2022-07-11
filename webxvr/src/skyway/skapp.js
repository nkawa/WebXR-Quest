import {
    SkyWayAuthToken,
    uuidV4,
} from '@skyway-sdk/core';

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
export const SWTokenString = webxvrToken.encode(secretKey);


// App 用のチャネルを作る（アプリ内で共通に？）
class SkyWayChannel{    
    constructor(){

    }
}
