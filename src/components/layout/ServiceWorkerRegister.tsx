"use client";

import { useEffect } from "react";

/**
 * Registers the offline-capable service worker on load.
 * The SW caches Pyodide CDN assets persistently — first run downloads
 * ~30 MB; subsequent sessions (subway, plane, etc.) load from cache.
 *
 * Skipped in development (HMR + SW caching is a debugging nightmare).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW register failed:", err));
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }
  }, []);

  return null;
}
