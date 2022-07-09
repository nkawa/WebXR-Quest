import React from 'react';
import ReactDOM from 'react-dom/client';
import { Route, Routes, HashRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';

import Main from './pages/Main';
import Info from './pages/Info';
import VRpage from './pages/VRpage';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/home" element={<Main />} />
      <Route path="/info" element={<Info />} />
      <Route path="/vr" element={<VRpage />} />
    </Routes>
  </HashRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();