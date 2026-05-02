"use client";

import { useEffect, useState } from "react";

/**
 * iOS Safari has no install prompt — users must tap Share → "Add to Home
 * Screen" manually. This banner explains how, once, and remembers dismissal.
 */
const STORAGE_KEY = "learner:install-hint-dismissed";

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    // iPad on iOS 13+ reports as Mac
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS-specific
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function IOSInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIOSSafari()) return;
    if (isStandalone()) return;
    if (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) return;
    // Small delay so it doesn't pop in the user's face on first paint.
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore — private mode
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Install Learner"
      className="fixed left-3 right-3 z-40 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl p-4 md:hidden"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue)] flex items-center justify-center shrink-0 text-white font-black text-lg">
          L
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Install Learner
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Tap{" "}
            <span aria-label="Share" className="inline-flex items-center align-middle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </span>
            {" "}then “Add to Home Screen” for an app-like, offline-capable experience on your subway commute.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-[var(--text-muted)] hover:text-[var(--foreground)] -mr-1 -mt-1 p-1"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
