import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Schriften lokal mitgeliefert, damit die App auch offline gleich aussieht.
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import './styles.css';
import { App } from './App';
import { applyTheme, loadTheme } from './theme';

applyTheme(loadTheme());

// Neue Version übernehmen: Sobald ein neuer Service Worker die Kontrolle hat, einmal neu laden.
// Beim Zurückkehren in die App nach Updates schauen.
if ('serviceWorker' in navigator) {
  // Beim allerersten Installieren gibt es noch keine alte Version: dann nicht neu laden.
  let bisher = navigator.serviceWorker.controller;
  let neuGeladen = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (bisher && !neuGeladen) { neuGeladen = true; location.reload(); }
    bisher = navigator.serviceWorker.controller;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
