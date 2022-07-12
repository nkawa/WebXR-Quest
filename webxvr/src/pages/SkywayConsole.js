import { Container, Nav, Navbar, Row, Col, Button, Table } from 'react-bootstrap';
import TopNavi from '../components/TopNavi';
import stringifyObject from 'stringify-object';
import { stringify } from "javascript-stringify";
import { useEffect, useState, useCallback } from 'react';

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


import { SWTokenString,MyInfo } from '../skyway/skapp';

let channel = null;
let person = null;
let context = null;

export default (props) => {
    const roomId = "uclab-xvr";

    const [browser, setBrowser] = useState("");
    const [ChannelInfo, SetChannelInfo] = useState([]);
    const [Publications, SetPublications] = useState([]);
    const [Subscriptions, SetSubscriptions] = useState([]);

    const setMember = useCallback(() => {
        const ci = [];
        let n = 1;
        for (const m of channel.members) {
            ci.push(({i:n, id:m.id, name:m.name,type: m.type, status:m._status}));

            n++;
        }
        console.log(ci);
        SetChannelInfo(ci);
    }, [ChannelInfo]);


    const setPubliactions = useCallback(() => {
        const ci = [];
        let n = 1;
        for (const m of channel.publications) {
            ci.push(({i:n, id:m.id, name:m.label,type: m.contenttype, status:m.side}));
            n++;
        }
//        console.log(ci);
        SetPublications(ci);
    }, [Publications]);

    const setSubscriptions = useCallback(() => {
        const ci = [];
        let n = 1;
        for (const m of channel.subscriptions) {
            ci.push(({i:n, id:m.id, name:m.label,type: m.contenttype, status:m.side}));
            n++;
        }
  //      console.log(ci);
        SetSubscriptions(ci);
    }, [Subscriptions]);

    console.log("Oh, channelInfo", ChannelInfo);

    const JoinSkyway = useCallback(async (e) => {
        context = await SkyWayContext.Create(SWTokenString, {
            logLevel: 'debug',
        });
        const plugin = new SfuClientPlugin();
        context.registerPlugin(plugin);
        channel = await SkyWayChannel.FindOrCreate(context, {
            name: roomId,
        });

        channel.onMembershipChanged.add((e) => {
            console.log("Membership changed", e);
            setMember();
        });
        channel.onPublicationChanged.add(()=>{
            setPubliactions();
        });
        channel.onSubscriptionChanged.add(()=>{
            setSubscriptions();
        });



        person = await channel.join({name:"admin,"+MyInfo});
        console.log(context);
        console.log(channel);
        console.log("Joined:", person);


    }, [ChannelInfo]);

    const check = () => {
        if (navigator.userAgent.indexOf("OculusBrowser") >= 0) {
            setBrowser("Oculus!");
        } else {
            setBrowser("Others");
        }
    }

    useEffect(() => {
        check()
    }, [])

    const doRemove = (id) =>{
        console.log("Work:"+id);
        for (const m of channel.members) {
            if(m.id == id){
                // force remove!
                console.log("Remove",m);
                channel.leave(m);
            }
        }
    }

    const TableRow = (props) => {
        console.log("Props",props);
        const { i, id, name, type, status } = props;

        return (
            <tr>
                <td>{i}</td>
                <td>{id}</td>
                <td>{name}</td>
                <td>{type}</td>
                <td>{status}</td>
                <td><Button size="sm" onClick={()=>{
                    console.log("Remove:"+id); doRemove(id)}
                }>Remove</Button></td>
            </tr>
        )
    }

    console.log("Navigator", navigator);
    return (
        <>

            <TopNavi />
            <Container>
                <Row>
                    <Col  >
                    Members:{ChannelInfo.length}　　　　
                        <Button onClick={JoinSkyway}> Join </Button>
                    </Col>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>id</th>
                                <th>name</th>
                                <th>type</th>
                                <th>status</th>
                                <th>action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ChannelInfo.map((m)=> <TableRow {...m} ></TableRow>)}
                        </tbody>
                    </Table>
                </Row>
                <Row>
                    <Col  >
                    Publications:{Publications.length}　　　　
                    </Col>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>id</th>
                                <th>name</th>
                                <th>label</th>
                                <th>content</th>
                                <th>side</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Publications.map((m)=> <TableRow {...m} ></TableRow>)}
                        </tbody>
                    </Table>
                </Row>
                <Row>
                    <Col  >
                    Subscriptions:{Subscriptions.length}　　　　
                    </Col>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>id</th>
                                <th>name</th>
                                <th>type</th>
                                <th>status</th>
                                <th>action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Subscriptions.map((m)=> <TableRow {...m} ></TableRow>)}
                        </tbody>
                    </Table>
                </Row>
            </Container>
        </>
    );
};


