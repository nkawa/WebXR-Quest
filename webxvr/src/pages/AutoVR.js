import { useEffect, useState, useCallback } from 'react';
import { WebXRButton } from '../vendor/util/webxr-button';
import { Scene, WebXRView } from '../vendor/render/scenes/scene';
import { Renderer, createWebGLContext } from '../vendor/render/core/renderer';
//import {Gltf2Node} from '../vendor/render/nodes/gltf2.js';
import { VideoboxNode } from '../vendor/render/nodes/videobox';
import { InlineViewerHelper } from '../vendor/util/inline-viewer-helper';

import { VideoNode } from '../vendor/render/nodes/video';
//import {QueryArgs} from '../vendor/util/query-args.js';
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

import { SWTokenString } from '../skyway/skapp';

const scene = new Scene();
let renderer = null;
let gl = null;
let xrImmersiveRefSpace = null;
let inlineViewerHelper = null;
let newVideo = null;

let context = null;
let channel = null;
let person = null;
let xrButton = null;

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
      addStatus("Joining!" + roomId);
      channel = await SkyWayChannel.FindOrCreate(context, {
        name: roomId,
      });
      person = await channel.join({});
      addStatus("Joined:" + roomId);

      person.onStreamSubscribed.add(async ({ stream, subscription }) => {
        const publisherId = subscription.publication.origin.publisher.id;
        if (stream instanceof RemoteDataStream) {
          return;
        }
        if (!userVideo[publisherId]) {// ?????????????????????
          newVideo = document.createElement('video');
          newVideo.playsInline = true;
          // mark peerId to find it later at peerLeave event
          newVideo.setAttribute(
            'data-member-id',
            subscription.publication.publisher.id
          );
          newVideo.autoplay = true;
          stream.attach(newVideo);
          // VR mode ?????????????????????
          const remoteVideos = document.getElementById('js-remote-streams');
          newVideo.setAttribute("width", "" + window.innerWidth);
          newVideo.setAttribute("height", "" + window.innerHeight);
          console.log("VideoState", newVideo.videoState);
          newVideo.addEventListener("loadeddata", () => {
            console.log("Video Loaded!!!");
            remoteVideos.append(newVideo);
            scene.addNode(new VideoboxNode({
              video: newVideo
            }));

          })

          // ?????????????????????????????? Scene ?????????????????????

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
        //        const remoteVideos = document.getElementById('js-remote-streams');

        //       const remoteVideo = remoteVideos.querySelector(
        //         `[data-member-id="${e.member.id}"]`
        //       );
        //        if (remoteVideo) {
        //          const stream = remoteVideo.srcObject;
        //          if (stream) {
        //           stream.getTracks().forEach((track) => track.stop());
        //         }
        //        remoteVideo.srcObject = null;
        //        remoteVideo.remove();
        //      } else {
        //        console.log("remove");
        //        remoteVideos.innerHTML = null;
        //      }
        console.log("should stop remote video");
      });

      person.onLeft.once(() => {
        /*        Array.from(remoteVideos.children).forEach((element) => {
                  const remoteVideo = element;
                  const stream = remoteVideo.srcObject;
                  if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                  }
                  remoteVideo.srcObject = null;
                  remoteVideo.remove();
                });
                */
        channel.dispose();
      });

    };

    // timer

    await startListen();

  }


  function initXR() {
    xrButton = new WebXRButton({
      onRequestSession: onRequestSession,
      onEndSession: onEndSession
    });
    document.querySelector('header').appendChild(xrButton.domElement);

    if (navigator.xr) {
      // How about WebXR
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        xrButton.enabled = supported;
      });

      navigator.xr.requestSession('inline').then(onSessionStarted);
    }
  }

  function initGL() {
    if (gl)
      return;

    gl = createWebGLContext({
      xrCompatible: true
    });

    document.body.appendChild(gl.canvas);

    function onResize() {
      gl.canvas.width = gl.canvas.clientWidth * window.devicePixelRatio;
      gl.canvas.height = gl.canvas.clientHeight * window.devicePixelRatio;
      // for video
      if (newVideo) {
        newVideo.setAttribute("width", "" + window.innerWidth);
        newVideo.setAttribute("height", "" + window.innerHeight);
      }
    }
    window.addEventListener('resize', onResize);
    onResize();

    renderer = new Renderer(gl);
    scene.setRenderer(renderer);

  }

  function onRequestSession() {
    return navigator.xr.requestSession('immersive-vr').then((session) => {
      xrButton.setSession(session);
      session.isImmersive = true;
      onSessionStarted(session);
    });
  }

  function onSessionStarted(session) {
    session.addEventListener('end', onSessionEnded);

    initGL();
    scene.inputRenderer.useProfileControllerMeshes(session);
    let glLayer = new XRWebGLLayer(session, gl);
    session.updateRenderState({ baseLayer: glLayer });

    let refSpaceType = session.isImmersive ? 'local' : 'viewer';
    session.requestReferenceSpace(refSpaceType).then((refSpace) => {
      if (session.isImmersive) {
        xrImmersiveRefSpace = refSpace;
      } else {
        inlineViewerHelper = new InlineViewerHelper(gl.canvas, refSpace);
      }
      session.requestAnimationFrame(onXRFrame);
    });
  }

  function onEndSession(session) {
    session.end();
  }


  function onSessionEnded(event) {
    if (event.session.isImmersive) {
      xrButton.setSession(null);
    }
  }

  //????????????????????????
  function onXRFrame(t, frame) {
    let session = frame.session;
    let refSpace = session.isImmersive ?
      xrImmersiveRefSpace :
      inlineViewerHelper.referenceSpace;
    let pose = frame.getViewerPose(refSpace);

    scene.startFrame();

    session.requestAnimationFrame(onXRFrame);

    let glLayer = session.renderState.baseLayer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (pose) {
      let views = [];
      for (let view of pose.views) {

        let renderView = new WebXRView(view, glLayer);

        // It's important to take into account which eye the view is
        // associated with in cases like this, since it informs which half
        // of the stereo image should be used when rendering the view.
        renderView.eye = view.eye
        views.push(renderView);
      }

      scene.updateInputSources(frame, refSpace);

      scene.drawViewArray(views);

    }

    scene.endFrame();
  }
  useEffect(() => {
    console.log("Set Skyway");
    doit();
    console.log("VR page loaded");
    initXR();
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

