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
/*class SkyWayChannel{    
    constructor(){

    }
}
*/

export var MyInfo = null;
export var CltJson = null;

var csrftoken= null;

export default function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export const CltInfo = (mode)=>{
    console.log("CltInfo:",mode);
    if (!MyInfo){
        axios.get("https://ipinfo.io/?token="+process.env.REACT_APP_IPINFO_TOKEN).then((res)=>{
            CltJson = res;
            MyInfo = JSON.stringify(CltJson);
        }, process.env.REACT_APP_IPINFO_TOKEN);
    }
    
    if (!csrftoken){
//        csrftoken = getCookie('csrftoken');
        axios.defaults.headers.common = {
           'X-Requested-With': 'XMLHttpRequest',
//            'X-CSRFToken': csrftoken
        };
    
    }
//    axios.post("https://xvr.uclab.jp/api/newAccess",{
      axios.post("https://xvr.uclab.jp/api/newAccess",{
            json: CltJson,
        agent: window.navigator.userAgent,
        mode : mode
    }).then((res)=>{
//        console.log("Access!",res);
    });
}

if (!MyInfo){
    // obtain client information
    CltInfo("loaded");
}
