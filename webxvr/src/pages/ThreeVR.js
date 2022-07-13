import { useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


import './VR.css';

import {
  SkyWayChannel,
  RemoteDataStream,
  SkyWayAuthToken,
  SkyWayContext,
  SkyWayMediaDevices,
  uuidV4,
  LocalVideoStream,
} from '@skyway-sdk/core';

import { SfuBotMember, SfuClientPlugin } from '@skyway-sdk/sfu-client';

import { SWTokenString , MyInfo, CltInfo} from '../skyway/skapp';
import { VRButton } from "../vendor/three/VRButton.js"; 

let scene = null;
let renderer = null;
let gl = null;
let xrImmersiveRefSpace = null;
let inlineViewerHelper = null;
let newVideo = null;

let context = null;
let channel = null;
let person = null;
let xrButton = null;

let box=null;
let myip = null;
let sphere = null;

export default (props) => {
  // XR globals.
  const [userVideo, setUserVideo] = useState({});
  console.log("re-rendar:autoVR:");


  const addStatus = useCallback((st) => {
    console.log("AddStatus:" + st);
  }, []);
  const plugin = new SfuClientPlugin();

  async function doit() {
    const roomId = "uclab-xvr";
    context = await SkyWayContext.Create(SWTokenString, {
      logLevel: 'debug',
    });
    context.registerPlugin(plugin);
  
    // Register join handler
    const startListen = async () => {
//      addStatus("Joining!" + roomId);
      channel = await SkyWayChannel.FindOrCreate(context, {
        name: roomId,
      });
      person = await channel.join(
        {name:"VR,"+MyInfo+","+ uuidV4() } 
      ).catch(error=>{console.log("Can't join",error)})
      // unique name
//      addStatus("Joined:" + roomId);
      CltInfo("VR",person.id);
      
      person.onStreamSubscribed.add(async ({ stream, subscription }) => {
        const publisherId = subscription.publication.origin.publisher.id;
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
          newVideo.autoplay = true;
          stream.attach(newVideo);
          // VR mode じゃない場合は
          const remoteVideos = document.getElementById('js-remote-streams');
          newVideo.setAttribute("width", "" + window.innerWidth);
          newVideo.setAttribute("height", "" + window.innerHeight);
          console.log("VideoState", newVideo.videoState);
          newVideo.addEventListener("loadeddata", () => {
            console.log("Video Loaded!!!");
            remoteVideos.append(newVideo);
            
            // THREE.js のテクスチャにする
            const texture = new THREE.VideoTexture(newVideo );
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBAFormat;
//            const parameters = {color: 0xffffff, map: texture};

            const geometry = new THREE.SphereGeometry(500, 60, 40);
		        geometry.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
            const material = new THREE.MeshBasicMaterial({ map: texture });
    
//            const geometry = new THREE.BoxGeometry();
//            const material = new THREE.MeshBasicMaterial( { map: texture } );
            sphere = new THREE.Mesh(geometry, material);
            sphere.rotation.y -= Math.PI/2;
//            box.position.z = -3;
            scene.remove(box);
            box = null;

            scene.add(sphere);
            
//            boxs = [];
          })

          // ここで、エレメントを Scene に追加したい！

          console.log("Appending!", newVideo);
          const nn = {};
          nn[publisherId] = newVideo;
          setUserVideo(nn)
        }

        //        const newVideo = userVideo[publisherId];
      });
      const subscribe = async (publication) => {

        if (publication.origin && publication.origin.publisher.id !== person.id) {
          await person.subscribe(publication.id);
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

        if (e.member.id === person.id) return;
        console.log("should stop remote video");
      });

      person.onLeft.once(() => {
        channel.dispose();
      });

    };

    // timer

    await startListen();

  }


  function initGL() {
    if (gl)
      return;

    scene = new THREE.Scene();
    const camera =  new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // レンダラーのXRを有効化
    document.body.appendChild(renderer.domElement);

    const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    box = new THREE.Mesh(geometry, material);
    box.position.z = -5;
    scene.add(box);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    document.body.appendChild(VRButton.createButton(renderer));
//    boxs.push(box);

    function animate() {
        if (box){
            box.rotation.x += 0.01;
            box.rotation.y += 0.01;
            controls.update();
          }else{// vr mode
            
//            if (sphere){
//              sphere.rotation.y += 0.007;
//            }
          }
        renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(animate);

  }

  useEffect(() => {
    console.log("VR page loaded");
    initGL();
    console.log("Set Skyway");
    doit();
    return (async () => {
      console.log("Leave AutoVR", person);
      if(person){
        await person.leave();
        person = null;
      }
    });
  }, []);
  return (
    <>
      <header>
        <details open>
          <summary> VR Page</summary>
          Enjoy VR view!!  <a href="./" className="back"> Back</a>
        </details>

      </header>
      <div id="js-remote-streams"></div>
    </>
  );
};

