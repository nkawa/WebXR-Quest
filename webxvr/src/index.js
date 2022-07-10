import React from 'react';
import ReactDOM from 'react-dom/client';
import { Route, Routes, HashRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import Main from './pages/Main';
import Info from './pages/Info';
import VRpage from './pages/VRpage';
import AutoVR from './pages/AutoVR';
import SkywayClient from   './pages/SkywayClient';
import SkywayReceive from   './pages/SkywayReceive';
import AutoReceive from   './pages/AutoReceive';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/home" element={<Main />} />
      <Route path="/info" element={<Info />} />
      <Route path="/autovr" element={<VRpage />} /> 
      <Route path="/vr" element={<AutoVR />} /> 
      <Route path="/skyway" element={<SkywayClient />} />
      <Route path="/swrecv" element={<SkywayReceive />} />
      <Route path="/autorecv" element={<AutoReceive />} />
    </Routes>
  </HashRouter>
);



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
