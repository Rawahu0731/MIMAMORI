

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Intro from './Intro';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/app" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
