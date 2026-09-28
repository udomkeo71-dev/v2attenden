"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, RefreshCw, X, CheckCircle2 } from "lucide-react";

export const PwaUpdater: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;

    // When the service worker controller changes, reload smoothly to load fresh assets
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("v2_just_updated", "true");
        window.location.reload();
      }
    });

    // Check if we just updated on page load
    if (sessionStorage.getItem("v2_just_updated") === "true") {
      sessionStorage.removeItem("v2_just_updated");
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 5000);
    }

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // If an update is already waiting, trigger activation
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // When a new update is found
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content is available, activate immediately!
                newWorker.postMessage({ type: "SKIP_WAITING" });
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Periodic update check every 3 minutes (180,000 ms)
        const updateInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 180000);

        // Check for updates when user brings app to foreground
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
          clearInterval(updateInterval);
          document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
      })
      .catch((err) => {
        console.warn("ServiceWorker registration error:", err);
      });
  }, []);

  if (justUpdated) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-300 font-kantumruy border border-emerald-400">
        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
        <span>✨ App លើទូរស័ព្ទត្រូវបានអាប់ដេតកំណែថ្មីដោយស្វ័យប្រវត្តិរួចរាល់!</span>
        <button
          onClick={() => setJustUpdated(false)}
          className="ml-2 text-emerald-200 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (updateAvailable) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-300 font-kantumruy border border-blue-400">
        <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
        <span>កំពុងទាញយក និងអាប់ដេតកំណែថ្មីលើទូរស័ព្ទ...</span>
      </div>
    );
  }

  return null;
};
