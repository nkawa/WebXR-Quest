import React from 'react';
import ReactDOM from 'react-dom/client';
import { Route, Routes, HashRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import Main from './pages/Main';
//import Info from './pages/Info';
//import VRpage from './pages/VRpage';
import AutoVR from './pages/AutoVR';
//import VideoVR from './pages/flatVideoVR';
import SkywayClient from   './pages/SkywayClient';
import AutoSend from   './pages/AutoSend';
import SkywayReceive from   './pages/SkywayReceive';
import AutoReceive from   './pages/AutoReceive';
import ThreeVR from   './pages/ThreeVR';
import SkywayConsole from './pages/SkywayConsole';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<Main />} />
{/*       />
      <Route path="/info" element={<Info />} />
      <Route path="/vr" element={<VRpage />} /> 
      <Route path="/flatVideo" element={<VideoVR />} /> 
      <Route path="/autovr" element={<AutoVR />} /> 
      <Route path="/autovr" element={<AutoVR />} /> 
*/}
      <Route path="/home" element={<Main />} />
      <Route path="/threevr" element={<ThreeVR />} /> 
      <Route path="/skyway" element={<SkywayClient />} />
      <Route path="/swrecv" element={<SkywayReceive />} />
      <Route path="/autorecv" element={<AutoReceive />} />
      <Route path="/autosend" element={<AutoSend />} />
      <Route path="/admin" element={<SkywayConsole />} />

    </Routes>
  </HashRouter>
);



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
