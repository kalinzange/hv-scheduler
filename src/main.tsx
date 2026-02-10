import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Show a banner when a new version is available
function showUpdateBanner() {
  // Only show once per session
  if (sessionStorage.getItem("updateBannerShown")) return;
  sessionStorage.setItem("updateBannerShown", "true");

  const banner = document.createElement("div");
  banner.id = "sw-update-banner";
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 20px;">
        <div>
          <strong style="font-size: 16px; display: block; margin-bottom: 6px;">📦 New Version Available</strong>
          <p style="margin: 0; font-size: 14px; opacity: 0.95;">
            Please refresh your browser to get the latest features and improvements.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.85;">
            <strong>Windows/Linux:</strong> Press <code style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 3px;">Ctrl + Shift + R</code>
            <span style="margin: 0 8px;">•</span>
            <strong>Mac:</strong> Press <code style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 3px;">⌘ + Shift + R</code>
          </p>
        </div>
        <button 
          onclick="document.getElementById('sw-update-banner')?.remove()"
          style="
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            min-width: 80px;
            transition: all 0.2s;
            flex-shrink: 0;
          "
          onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.borderColor='rgba(255,255,255,0.5)';"
          onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.borderColor='rgba(255,255,255,0.3)';"
        >
          Dismiss
        </button>
      </div>
    </div>
  `;
  document.body.insertBefore(banner, document.body.firstChild);

  // Add padding to body to account for banner height
  document.body.style.paddingTop = "110px";
  document.documentElement.style.scrollBehavior = "smooth";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register a basic service worker for PWA installability/offline shell
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/hv-scheduler/service-worker.js")
      .then((registration) => {
        // Check version.json to determine if banner should be shown
        async function checkAndShowBannerIfVersionChanged() {
          try {
            const response = await fetch("/hv-scheduler/version.json", {
              cache: "no-store", // Bypass cache to get latest
            });
            const newVersionData = (await response.json()) as {
              version?: string;
            };
            const currentVersion = localStorage.getItem("app-version");

            // Only show banner if version actually changed
            if (
              newVersionData.version &&
              newVersionData.version !== currentVersion
            ) {
              console.log(
                `[App] Version changed from ${currentVersion} to ${newVersionData.version} - showing banner`,
              );
              showUpdateBanner();
              // Update stored version (in case user dismisses banner)
              localStorage.setItem("app-version", newVersionData.version);
            } else if (newVersionData.version) {
              console.log(
                `[App] SW updated but version unchanged (${newVersionData.version}) - no user action needed`,
              );
            }
          } catch (error) {
            console.log("[App] Version check skipped:", error);
          }
        }

        // Listen for service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            // When new SW is waiting to activate, check if version actually changed
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log(
                "[App] Service worker installed - checking version...",
              );
              checkAndShowBannerIfVersionChanged();
            }
          });
        });

        const UPDATE_INTERVAL_MS = 30 * 60 * 1000;

        function canCheckForUpdates() {
          return document.visibilityState === "visible" && navigator.onLine;
        }

        function triggerUpdateCheck() {
          if (!canCheckForUpdates()) return;
          registration.update().catch(() => {});
        }

        // Check for updates periodically (every 30 minutes)
        setInterval(triggerUpdateCheck, UPDATE_INTERVAL_MS);

        // Also check when the tab becomes visible again
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            triggerUpdateCheck();
          }
        });

        // Initial opportunistic check
        triggerUpdateCheck();
      })
      .catch((error) => console.error("SW registration failed", error));
  });

  // Reload the app when a new version is detected by the service worker
  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data as { type?: string; data?: unknown } | undefined;
    if (data?.type === "VERSION_UPDATED") {
      // Clear IndexedDB cache to prevent stale data
      console.log("[App] New version detected, clearing IndexedDB cache");
      try {
        indexedDB.deleteDatabase("hv-scheduler-cache");
      } catch (error) {
        console.warn("[App] Failed to clear IndexedDB:", error);
      }
      // Force reload to get fresh code
      window.location.reload();
    }
  });
}
