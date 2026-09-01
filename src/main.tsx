import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import repiqrFavicon from '../assets/REPIQR ICON .png';
// Side-effect import: registers the beforeinstallprompt listener as early as
// possible. Chrome can fire that event within moments of the first paint,
// and it is never re-dispatched — if this module only loaded later (e.g.
// lazily, the first time a component that uses it rendered), the event
// could already have fired and been missed, silently making an Install
// button never appear for the rest of the session.
import './lib/pwaInstall';

// Auto-updates in the background; the next reload (tab close/reopen, or a
// manual refresh) picks up the new version with no interstitial "update
// available" prompt to build/maintain.
registerSW({ immediate: true });

// Set active browser favicon
const favLink = (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement('link');
favLink.type = 'image/png';
favLink.rel = 'icon';
favLink.href = repiqrFavicon;
if (!document.querySelector("link[rel*='icon']")) {
  document.head.appendChild(favLink);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
