import { Container, Nav, Navbar, Row, Col, Button, Table } from 'react-bootstrap';
import TopNavi from '../components/TopNavi';
import stringifyObject from 'stringify-object';
import { stringify } from "javascript-stringify";
import { useEffect, useState, useCallback } from 'react';
import {Chart} from "react-chartjs-2";
import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale } from 'chart.js';


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


import { SWTokenString,MyInfo,CltInfo,AddLog } from '../skyway/skapp';

ChartJS.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

let channel = null;
let person = null;
let context = null;
let timeLabel = ["0"];
let subData = [0];
let memData = [0];
let lastTime = 0;

export default (props) => {
    const roomId = "uclab-xvr";

    const [browser, setBrowser] = useState("");
    const [ChannelInfo, SetChannelInfo] = useState([]);
    const [Publications, SetPublications] = useState([]);
    const [Subscriptions, SetSubscriptions] = useState([]);
    const [GraphData, SetGraphData] = useState(
        {
            labels: timeLabel,
            datasets: [
            {
                label: "Subs",
                data: subData,
                borderColor: "rgb(75,192,192)",                
            },
            {
                label: "Members",
                data: memData,
                borderColor: "rgb(75,100,192)",
            },
            ],
        }

    );
    const options= {
        maintainAspectRatio: false,
    };
    
    const updateGraph = useCallback((s,m)=>{
        const dt = new Date();
        const st = dt.getHours()+":"+dt.getMinutes()+":"+dt.getSeconds();
        if (dt.getTime() - lastTime< 2000){ //2秒以内
            return;
        }
        lastTime = dt.getTime;     
        const l =  { 
            sub: s, 
            mem: m,
            time: dt
        };
        AddLog(l);
        timeLabel.push(st);
        subData.push(s);
        memData.push(m);
        SetGraphData(GraphData);
    },[GraphData])


    const setMember = useCallback(() => {
        const ci = [];
        let n = 1;
        for (const m of channel.members) {
            ci.push(({i:n, id:m.id, name:m.name,type: m.type, status:m._status}));

            n++;
        }
        console.log(ci);
        updateGraph(channel.subscriptions.length,ci.length );
        SetChannelInfo(ci);
    }, [ChannelInfo]);


    const setPubliactions = useCallback(() => {
        const ci = [];
        let n = 1;
        for (const m of channel.publications) {
            console.log(m);
            ci.push(({i:n, id:m.id, name:m.publisherId,type: m.originId, status:m._status}));
            n++;
        }
//        console.log(ci);
        SetPublications(ci);
    }, [Publications]);

    const setSubscriptions = useCallback(() => {
        const ci = [];
        let n = 1;
        for (const m of channel.subscriptions) {
            console.log(m);
            ci.push(({i:n, id:m.id, name:m.subscriberId,type: m.publicationId, status:m._status}));
            n++;
        }
  //      console.log(ci);
        updateGraph(ci.length,channel.members.length );
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
            // we need to send NewAccess Info!
            setSubscriptions();
        });

        person = null;
        person = await channel.join({name:"graphAdmin,"+MyInfo+","+uuidV4()}
        ).catch((error)=>{
            console.log("Can't join",error);
        });
        if (person) {
            CltInfo("Graph", person.id);
        }
        console.log(context);
        console.log(channel);
        console.log("Joined:", person);

        setPubliactions();
        setSubscriptions();


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
        const { i, id, name, type, status, action } = props;

        return (
            <tr>
                <td>{i}</td>
                <td>{id}</td>
                <td>{name}</td>
                <td>{type}</td>
                <td>{status}</td>
                {(action=="remove")?
                    <td><Button size="sm" onClick={()=>{
                        console.log("Remove:"+id); doRemove(id)}
                    }>{action}</Button></td>
                 :<td></td>
                }
            </tr>
        )
    }

    console.log("Navigator", navigator);
    return (
        <>

            <TopNavi />
            <Row>
                    <Col  >
                    Members:{ChannelInfo.length}　　　　
                        <Button onClick={JoinSkyway}> Join </Button>
                    </Col>
                </Row>
                <div className="chart-container" style={{position: 'relative'}}>
                    <Chart type='line'
        height={400}
        width={1400}
        data={GraphData}
        options={options}
        id="chart-key"
                    />
                    </div>


                {/*
                                    <Row>    
            <Container>
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
                            {ChannelInfo.map((m,i)=> <TableRow key={i} {...m} action="remove"></TableRow>)}
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
                                <th>publisher</th>
                                <th>origin</th>
                                <th>content</th>
                                <th>side</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Publications.map((m,i)=> <TableRow key={i} {...m} ></TableRow>)}
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
                                <th>subscriber</th>
                                <th>publicationId</th>
                                <th>status</th>
                                <th>action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Subscriptions.map((m,i)=> <TableRow key={i} {...m} ></TableRow>)}
                        </tbody>
                    </Table>
                </Row>
            </Container>
    */}
        </>
    );
};


