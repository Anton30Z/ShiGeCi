import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (import.meta.env.DEV) {
  // Clean up any previously registered dev service workers and caches that could trigger reload loops
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        if (key.includes('workbox') || key.includes('precache') || key.includes('vite-pwa')) {
          caches.delete(key);
        }
      }
    });
  }
} else {
  registerSW({
    immediate: false,
    onNeedReload() {
      // Never force-reload mid-session
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
