import { useEffect } from 'react';
//import {Entity, Scene } from 'aframe-react';

import {WebXRButton} from '../vendor/util/webxr-button';
import {Scene, WebXRView} from '../vendor/render/scenes/scene';
import {Renderer, createWebGLContext} from '../vendor/render/core/renderer';
//import {Gltf2Node} from '../vendor/render/nodes/gltf2.js';
import {SkyboxNode} from '../vendor/render/nodes/skybox';
import {InlineViewerHelper} from '../vendor/util/inline-viewer-helper';
//import {QueryArgs} from '../vendor/util/query-args.js';
import './VR.css';


export default (props)=>{

    const appId = process.env.REACT_APP_SKYWAY_APPID;
    const secretKey = process.env.REACT_APP_SKYWAY_SECRETKEY;

    // we neet do check browser capability

      // XR globals.
      let xrButton = null;
      let xrImmersiveRefSpace = null;
      let inlineViewerHelper = null;
      let gl = null;
      let renderer = null;
      let scene = new Scene();
      scene.addNode(new SkyboxNode({
        url: 'media/chess-pano-4k.png',
        displayMode: 'stereoTopBottom'
      }));



      function initXR() {
        xrButton = new WebXRButton({
          onRequestSession: onRequestSession,
          onEndSession: onEndSession
        });
        document.querySelector('header').appendChild(xrButton.domElement);

        if (navigator.xr ) {
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

      //ここでポーズ更新
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
    useEffect(()=>{
        console.log("VR page loaded");
       initXR();
    },[]);


    return (
        <>
            <header>
                <details open>
                    <summary> VR Page</summary>
                    Enjoy VR view!  <a class="back" href="./">Back</a>
                </details>

            </header>
        </>
    );
};


