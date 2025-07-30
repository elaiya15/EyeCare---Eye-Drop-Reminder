import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// main.tsx or main.jsx
import { registerSW } from 'virtual:pwa-register';
registerSW(); // Auto registers and updates service worker

// Register service worker for PWA
// REMOVE THIS OLD CODE:
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//   });
// };



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
