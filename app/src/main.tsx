import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.tsx';
import { applyColorTheme, getColorTheme } from './lib/colorTheme';

// Flag the native (Tauri) build so the chrome can make room for the macOS
// traffic-light buttons and offer a draggable title bar.
const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
if (isTauri) document.documentElement.classList.add('tauri');

// Apply the saved color theme before first paint (no flash).
applyColorTheme(getColorTheme(), document.documentElement.classList.contains('dark'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register the service worker so Forage is installable (web only — Tauri has no SW).
if (!isTauri && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
