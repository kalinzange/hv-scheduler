import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register a basic service worker for PWA installability/offline shell
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/hv-scheduler/service-worker.js")
      .catch((error) => console.error("SW registration failed", error));
  });

  // Reload the app when a new version is detected by the service worker
  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data as { type?: string; data?: unknown } | undefined;
    if (data?.type === "VERSION_UPDATED") {
      window.location.reload();
    }
  });
}
