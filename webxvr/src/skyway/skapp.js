import {
    SkyWayAuthToken,
    uuidV4,
} from '@skyway-sdk/core';
import axios from "axios";

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

export var MyInfo = null;

if (!MyInfo){
    // obtain client information
    axios.get("https://ipinfo.io?token="+process.env.REACT_APP_IPINFO_TOKEN).then((res)=>{
        MyInfo = JSON.stringify(res);
    });
}