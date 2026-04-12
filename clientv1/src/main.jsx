import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App.jsx"

// Register service worker for web push notifications.
// Works in browsers; Cordova apps use the same sw.js via a plugin.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)