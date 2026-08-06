import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import repiqrFavicon from '../assets/REPIQR ICON .png';

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
