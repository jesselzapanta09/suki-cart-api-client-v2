import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App.jsx"

// Set up message listener as early as possible (before SW ready on Chrome)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
      const payload = event.data.payload;
      // Dispatch a custom event so components can listen to active notifications
      window.dispatchEvent(new CustomEvent('pushNotification', {
        detail: payload
      }));
      console.log('[Push] Notification received while page active:', payload);
    }
  });
}

// Register service worker for web push notifications.
// Works in browsers; Cordova apps use the same sw.js via a plugin.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      console.log('[SW] Registered successfully:', reg);
    }).catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)