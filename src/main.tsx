import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App/>
    </StrictMode>
);

const title = import.meta.env.VITE_APP_TITLE || 'Default App Title';
const favicon = import.meta.env.VITE_FAVICON_URL || '/favicon.png';

if (title) {
    document.title = title;
}

if (favicon) {
    const link: HTMLLinkElement =
        document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.href = favicon;
    link.type = 'image/png';
    document.head.appendChild(link);
}