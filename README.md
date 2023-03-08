# WebXR-Quest
Challenge to play with WebXR

using 
nodejs 16.16.0
nodejs 16.19.1  2023/03/08

with react, react-bootstrap 2.4.0, bootstrap 5.1.6

2022/07/13 project by N.Kawaguchi.
2023/03/08 v0.20 update for Skyway 1.1  by N.Kawaguchi.

## Nginx reverse proxy
If you want to use nginx, you need to setup reverse proxy

## Debug
yarn start

## Build
yarn build
and use under build directory.
--
## Setup

You have to set-up following env-variables in '.env' file of webxvr subdir.

SKYWAY-beta : https://skyway.ntt.com/

ipinfo:  https://ipinfo.io/

'''
REACT_APP_SKYWAY_APPID=<skyway-beta-appid>
REACT_APP_SKYWAY_SECRETKEY=<skyway-beta-secretkey>
REACT_APP_IPINFO_TOKEN=<ipinfo-token>
'''


