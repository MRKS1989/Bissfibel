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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
