# 10 — PWA & Offline-First Architecture

> Research document 10 of 12 for **Learner** — a gamified developer learning app.
> This document addresses the foundational technical requirement of the entire project: the app must work fully offline during NYC subway commutes, with no perceptible degradation in core functionality.

---

## 1. What is a PWA?

A Progressive Web App is a web application that uses modern browser APIs to deliver an experience indistinguishable from a native mobile app. The "progressive" label means the app works as a normal website on browsers that lack support for advanced features, and progressively enhances into an installable, offline-capable application on browsers that do support them.

The technology stack behind a PWA consists of four pillars:

**Service Worker** — a JavaScript file that runs in a separate thread from the main page. It acts as a programmable network proxy: every HTTP request the app makes (HTML pages, API calls, images, WASM binaries) passes through the service worker, which can intercept, cache, modify, or fabricate responses. This is the mechanism that enables offline functionality.

**Web App Manifest** — a JSON file (`manifest.json`) that tells the browser how to present the app when installed. It specifies the app name, icons, theme colors, display mode (standalone, fullscreen, etc.), and start URL. When the manifest is present and the service worker is registered, browsers offer an "Add to Home Screen" install prompt.

**Cache API** — a key-value store for HTTP request/response pairs, accessible from both the service worker and the main thread. Unlike the browser's built-in HTTP cache (which is heuristic and can be evicted at any time), the Cache API gives developers explicit control over what is stored, when it expires, and how it is served.

**IndexedDB** — a transactional, indexed object store built into every modern browser. It handles structured application data (user progress, spaced repetition card states, session history) as opposed to the Cache API, which handles network responses.

### Benefits Over Native Apps

For a solo-developer project like Learner, PWA is the only rational choice:

- **Single codebase** — one React/Next.js application runs on every platform. No Swift for iOS, no Kotlin for Android, no Electron for desktop. The entire team is one person; maintaining three native codebases is impossible.
- **No app store** — no Apple review process (which takes 1-7 days and frequently rejects apps for arbitrary reasons), no $99/year Apple Developer fee, no Google Play $25 registration fee. The app is deployed to a URL and instantly available worldwide.
- **Instant updates** — when the service worker detects a new version, the update is applied on the next app open. No user action required, no "Update Available" nag screens, no version fragmentation.
- **URL-shareable** — a user can share a link to a specific lesson or challenge. Native apps require deep-link configuration and universal links; PWAs get this for free because they are websites.
- **Discoverability** — the app is indexable by search engines. A user googling "learn Python closures" could land directly on that lesson.

### Browser Support

PWA support in 2026 is excellent across all major browsers:

- **Chrome / Edge (Chromium)** — full support. Service workers, Cache API, IndexedDB, Background Sync, Push Notifications, Web App Manifest install prompts. This covers ~70% of global browser market share.
- **Firefox** — full support for core PWA features (service workers, caching, IndexedDB). Install prompts are supported on Android but not desktop Firefox (desktop users can still use the app as a website).
- **Safari / iOS** — the historically weakest PWA platform, but Apple has made significant progress:
  - iOS 11.3 (2018): basic service worker support.
  - iOS 16.4 (2023): Web Push Notifications for installed PWAs.
  - iOS 17+ (2024): the 50MB storage cap for service worker caches was removed for installed PWAs. IndexedDB limits were also relaxed.
  - iOS 18+ (2025): improved service worker reliability, better background fetch support.
  - **Remaining iOS limitations:** no Background Sync API (must be polyfilled with online-detection on app open), no periodic background fetch, PWA state can still be purged after several weeks of inactivity if device storage is low (rare in practice on modern 128GB+ devices).

For Learner's target audience (developers in NYC, predominantly iPhone and modern Android), browser support is not a blocker for any core feature.

---

## 2. Web App Manifest

The manifest file tells the operating system how to present the installed PWA. For Learner, the configuration optimizes for a native feel on mobile:

```json
{
  "name": "Learner — Code Mastery Through Play",
  "short_name": "Learner",
  "description": "Master Python, TypeScript, and CS fundamentals through gamified challenges, spaced repetition, and AI tutoring — fully offline.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0a0a0f",
  "background_color": "#0a0a0f",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["education", "developer tools"],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Dashboard with skill tree and daily progress"
    }
  ]
}
```

Key decisions:

- **`display: "standalone"`** — removes the browser chrome (URL bar, navigation buttons). The app occupies the full screen with a native status bar, making it visually identical to a native app. The alternative `fullscreen` hides even the status bar, which is disorienting for non-game apps.
- **`theme_color: "#0a0a0f"`** — a near-black that matches the app's dark theme. This colors the status bar on Android and the title bar on desktop, reinforcing the dark aesthetic.
- **`background_color: "#0a0a0f"`** — the splash screen color shown while the app loads. Matching the theme color eliminates the white flash that plagues many PWAs on launch.
- **Maskable icon** — Android applies various icon shapes (circle, squircle, rounded square) depending on the device manufacturer. A maskable icon includes a safe zone that ensures the logo is never clipped. Without this, the icon looks broken on many Android devices.

### Next.js Integration

In Next.js App Router, there are two approaches:

**Static file:** Place `manifest.json` in the `public/` directory. It is served at `/manifest.json` and referenced in the root layout via a `<link>` tag.

**Dynamic generation:** Export a `manifest()` function from `app/manifest.ts`. This allows the manifest to be generated at build time with TypeScript type-checking, and Next.js automatically adds the `<link>` tag:

```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Learner — Code Mastery Through Play',
    short_name: 'Learner',
    start_url: '/',
    display: 'standalone',
    theme_color: '#0a0a0f',
    background_color: '#0a0a0f',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

The dynamic approach is recommended — it keeps the manifest co-located with other Next.js metadata and provides type safety.

### Install Prompt

Browsers show an install prompt ("Add to Home Screen") when three conditions are met: (1) the app is served over HTTPS, (2) a valid manifest is present with required fields, and (3) a service worker is registered. On Chrome Android, the prompt appears as a bottom banner after the user has engaged with the app for at least 30 seconds across at least two visits. On iOS Safari, the user must manually tap the share button and select "Add to Home Screen" — Apple does not show automatic install prompts.

For Learner, the app should include a subtle, dismissable banner on the second visit: "Install Learner for offline access" with a button that triggers the `beforeinstallprompt` event (on Chrome) or shows instructions for iOS.

---

## 3. Service Worker Architecture

The service worker is the engine of offline functionality. It runs in a background thread, persists across page navigations, and intercepts every network request the app makes.

### Lifecycle

1. **Registration** — the main app registers the service worker file (e.g., `/sw.js`). This typically happens once in the root layout component.
2. **Install** — the browser downloads the service worker file. During the `install` event, the worker pre-caches critical assets (the app shell). If any asset fails to cache, installation fails and the old service worker remains active.
3. **Activate** — after installation, the worker activates (immediately if `skipWaiting()` is called, or after all tabs using the old worker are closed). During `activate`, old caches are cleaned up.
4. **Fetch** — the worker intercepts every `fetch()` request from the app. The handler decides whether to serve from cache, go to the network, or do both.

### Caching Strategies

Different resources demand different caching strategies. The wrong strategy for a given resource type leads to either stale content or broken offline behavior:

| Resource Type | Strategy | Cache Name | Rationale |
|---|---|---|---|
| App shell (HTML, CSS, JS bundles) | **Cache-first**, network fallback | `learner-app-v1` | The app must load instantly offline. JS bundles change only on deploy, so cache-first is safe. Cache is invalidated by incrementing the version in the service worker. |
| Lesson content (rendered MDX) | **Cache-first**, background update | `learner-content-v1` | Lessons are static once published. Serving from cache provides instant load. A background fetch checks for updates and refreshes the cache silently for the next visit. |
| Pyodide WASM + packages | **Cache-first**, version-keyed | `learner-pyodide-v1` | The Pyodide bundle is ~11MB compressed. Re-downloading it on every visit is unacceptable. The cache key includes the Pyodide version (`0.29.3`), so upgrading Pyodide automatically invalidates the old cache. |
| Pre-cached AI hints | **Cache-first** if available | `learner-ai-cache-v1` | Hints are pre-generated while online and stored for offline use. If a hint is not cached, the app shows a generic fallback ("Try breaking the problem into smaller steps"). |
| Static assets (icons, images, fonts) | **Cache-first** | `learner-static-v1` | These never change between deploys. Cached once, served forever until version bump. |
| AI tutor chat (live) | **Network-only** | N/A | Real-time AI conversation requires a server. This feature is gracefully disabled offline with a clear message: "AI tutor requires internet. Use pre-cached hints instead." |
| Analytics / telemetry | **Network-only**, queue on failure | N/A | Analytics events are queued in IndexedDB and sent when connectivity resumes. No cache needed. |

### Cache Versioning

Each cache has a version suffix (`v1`, `v2`, etc.) controlled by a constant in the service worker file. When the app is updated:

1. The new service worker is downloaded (browsers automatically check for updates every 24 hours, or on every navigation if the file has changed by even one byte).
2. During `install`, the new worker pre-caches assets into versioned caches (`learner-app-v2`).
3. During `activate`, the worker deletes old caches (`learner-app-v1`).
4. All subsequent fetches use the new caches.

```javascript
// sw.js — cache cleanup during activation
const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  app: `learner-app-${CACHE_VERSION}`,
  content: `learner-content-${CACHE_VERSION}`,
  pyodide: `learner-pyodide-${CACHE_VERSION}`,
  static: `learner-static-${CACHE_VERSION}`,
  aiCache: `learner-ai-cache-${CACHE_VERSION}`,
};

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !Object.values(CACHE_NAMES).includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
});
```

### Registration in Next.js

Service worker registration happens in the root layout. Because `navigator.serviceWorker` is a browser API, it must be called from a client component or wrapped in a `useEffect`:

```typescript
// components/ServiceWorkerRegistrar.tsx
'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW registered, scope:', reg.scope);
        })
        .catch((err) => {
          console.error('SW registration failed:', err);
        });
    }
  }, []);
  return null;
}
```

This component is rendered once in the root layout and produces no visual output.

---

## 4. IndexedDB for Application State

The service worker's Cache API handles network responses (HTML pages, JS bundles, WASM files). Application state — everything the user generates or earns — lives in IndexedDB.

### Why Not localStorage?

localStorage is the obvious first choice, and it is the wrong one for this app:

| Factor | localStorage | IndexedDB |
|---|---|---|
| Storage limit | 5-10MB (varies by browser) | 50MB minimum; effectively unlimited on installed PWAs (browsers allocate up to 60% of free disk space) |
| API | Synchronous — blocks the main thread on every read/write | Asynchronous — never blocks the UI |
| Data types | String-only (everything must be JSON.stringify'd) | Structured clone — stores objects, arrays, dates, ArrayBuffers, Blobs natively |
| Querying | Key-only lookup | Indexes, key ranges, cursors — can query "all review cards due before today" without loading the entire dataset |
| Transactions | None | Full ACID transactions — multiple writes either all succeed or all roll back |

For Learner, the spaced repetition system alone could generate thousands of card records over months of use. localStorage would hit its 5MB limit within weeks. IndexedDB is the only viable option.

### The `idb` Library

Raw IndexedDB has a notoriously verbose, callback-based API dating from 2011. The `idb` library (by Jake Archibald, one of the original service worker spec authors) wraps it in Promises with zero overhead. It is 1.2KB gzipped and has no dependencies:

```typescript
import { openDB, type IDBPDatabase } from 'idb';

const db = await openDB('learner-db', 1, {
  upgrade(db) {
    // Create object stores on first open or version upgrade
    db.createObjectStore('user-profile', { keyPath: 'id' });

    const progress = db.createObjectStore('progress', { keyPath: 'nodeId' });
    progress.createIndex('by-status', 'status');

    const cards = db.createObjectStore('review-cards', { keyPath: 'cardId' });
    cards.createIndex('by-due', 'dueDate');

    db.createObjectStore('ai-cache', { keyPath: 'key' });
    db.createObjectStore('session-history', { keyPath: 'sessionId' });
    db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
  },
});
```

### Database Schema

```
learner-db (version 1)
├── user-profile          # Single record: XP, level, streak, settings, preferences
│   keyPath: 'id'         # Always 'default' (single-user app)
│
├── progress              # One record per skill tree node
│   keyPath: 'nodeId'     # e.g., 'python.functions.closures'
│   index: 'by-status'    # Values: 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered'
│   fields: nodeId, status, completedAt, bestScore, attempts, xpEarned
│
├── review-cards          # One record per FSRS spaced repetition card
│   keyPath: 'cardId'     # e.g., 'card-python-closure-001'
│   index: 'by-due'       # ISO date string, enables "get all cards due today" query
│   fields: cardId, nodeId, front, back, difficulty, stability, dueDate, reps, lapses, lastReview, history[]
│
├── ai-cache              # Pre-fetched AI responses for offline use
│   keyPath: 'key'        # e.g., 'hint:challenge-closures-01:step-1'
│   fields: key, type ('hint'|'explanation'|'review'), content, cachedAt, expiresAt
│
├── session-history       # Log of completed sessions for analytics
│   keyPath: 'sessionId'  # UUID
│   fields: sessionId, startedAt, endedAt, duration, xpEarned, nodesCompleted[], cardsReviewed, platform
│
└── sync-queue            # Actions pending upload when online
    keyPath: 'id'         # Auto-increment
    fields: id, type, payload, timestamp, retries, status ('pending'|'syncing'|'failed')
```

### Zustand + IndexedDB Persistence

Learner uses Zustand for state management (see research doc on state architecture). Zustand's `persist` middleware supports custom storage adapters. The default adapter uses localStorage, which must be replaced with IndexedDB:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

// Custom IndexedDB storage adapter for Zustand
const indexedDBStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
}));

export const useProgressStore = create(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      // ... actions
    }),
    {
      name: 'learner-progress',
      storage: indexedDBStorage,
    }
  )
);
```

The `idb-keyval` package (also by Jake Archibald, 600 bytes gzipped) is a simpler alternative to `idb` for key-value use cases like Zustand persistence. The full `idb` library is used for the structured stores (review cards, progress nodes) where indexes and queries are needed.

---

## 5. Offline Data Flow

This section traces the exact sequence of events during a subway commute — no internet, no compromises.

### Scenario: 30-Minute Subway Ride

**Step 1 — App Opens (0:00)**
The user taps the Learner icon on their home screen. The service worker intercepts the navigation request for `/` and serves the cached app shell (HTML + CSS + JS bundles). The app appears in under 1 second. There is no loading spinner, no "No Internet" error, no blank screen.

**Step 2 — Dashboard Renders (0:01)**
The root layout mounts the Zustand stores. Each store's `persist` middleware reads its state from IndexedDB via the custom adapter. Within 100ms, the dashboard displays: current XP (2,340), level (7), streak (12 days), and the recommended next session.

**Step 3 — User Taps "Continue Learning" (0:05)**
The app navigates to the next lesson in the curriculum (e.g., "Python Closures"). The MDX content for this lesson was pre-cached during the last WiFi sync. The service worker serves it from the `learner-content-v1` cache. The lesson renders with syntax-highlighted code examples, interactive diagrams, and embedded mini-quizzes.

**Step 4 — User Opens Code Playground (0:10)**
The lesson includes a "Try It Yourself" section with an embedded code editor. When the user taps it, the app lazy-loads Pyodide. The service worker serves the Pyodide WASM binary (~11MB) from the `learner-pyodide-v1` cache. Initial load takes 2-3 seconds (WASM compilation); subsequent loads in the same session are near-instant.

**Step 5 — User Writes and Runs Code (0:12)**
The user writes a closure example and taps "Run." Pyodide executes the code in a Web Worker, capturing stdout, stderr, and return values. The output panel displays the result. The entire execution happens on-device — no network request is made.

**Step 6 — User Submits Challenge (0:18)**
The user attempts the challenge at the end of the lesson. They write a function, tap "Submit," and Pyodide runs the test suite (5 test cases with assertions). All tests pass. The app awards 50 XP, updates the skill tree node to "completed," and writes the new state to IndexedDB. A celebration animation plays.

**Step 7 — User Requests Hint (0:20)**
On the next challenge, the user is stuck. They tap "Get Hint." The app checks the `ai-cache` store in IndexedDB for a pre-cached hint keyed to this challenge and step. The hint was pre-generated by the AI backend during the last WiFi sync and stored as structured text. It displays instantly.

**Step 8 — User Opens Spaced Repetition (0:25)**
With 5 minutes left, the user opens the review deck. The app queries IndexedDB for all review cards where `dueDate <= today`, sorted by due date. The FSRS algorithm runs entirely client-side to determine card scheduling. The user reviews 8 cards, and each response (Easy/Good/Hard/Again) updates the card's FSRS state in IndexedDB.

**Step 9 — User Exits Subway (0:30)**
The phone reconnects to cellular data. The service worker (or an `online` event listener in the app) detects connectivity. The sync queue in IndexedDB contains 14 pending actions (1 lesson completion, 1 challenge submission, 8 card reviews, 4 XP updates). These are processed sequentially, each marked as `syncing` and then removed on success.

---

## 6. Pre-Caching Strategy (WiFi Sync)

The offline experience is only as good as the pre-cache. If upcoming content is not cached, the user hits a dead end underground. The pre-cache pipeline runs automatically when the app detects a WiFi connection.

### Detection

```typescript
function isOnWiFi(): boolean {
  const conn = (navigator as any).connection;
  if (!conn) return navigator.onLine; // Fallback: assume online = WiFi
  return conn.type === 'wifi' || conn.effectiveType === '4g';
}
```

The `navigator.connection` API (Network Information API) is available on Chrome and Edge. On Safari and Firefox, the fallback treats any online state as a sync opportunity — cellular data is fast enough for the small payloads involved.

### What Gets Pre-Cached

When WiFi is detected and the app is open:

1. **Next 10 lessons** — the curriculum engine determines the next 10 nodes in the skill tree. Their rendered MDX content is fetched and stored in the content cache. Total size: ~200KB per lesson (text + inline SVGs), so ~2MB for 10 lessons.

2. **AI hints for next 10 challenges** — a single batch API call sends the next 10 challenge prompts to the AI backend, which returns structured hints (3 progressive hints per challenge: nudge, approach, solution). These are stored in the `ai-cache` IndexedDB store. Total size: ~5KB per challenge, so ~50KB for 10 challenges.

3. **Progress sync** — the current user state (XP, level, streak, completed nodes, card states) is uploaded to the cloud backend for backup and cross-device sync (future feature).

4. **Content update check** — the app checks a version manifest endpoint to see if any cached lessons have been updated. Updated lessons are re-fetched and the cache is refreshed.

### Storage Management

To prevent unbounded cache growth:

- **Keep the last 20 completed lessons cached** — users occasionally revisit recent material.
- **Evict lessons completed more than 20 sessions ago** — they can be re-fetched when needed.
- **Never evict Pyodide** — the 11MB WASM binary is too expensive to re-download. It stays cached indefinitely.
- **AI hint cache expires after 30 days** — hints for completed challenges are removed. Active challenge hints are kept.

### User Visibility

The app shows a clear offline readiness indicator:

- **"Ready for offline"** (green checkmark) — all upcoming content and hints are cached.
- **"Partially ready"** (yellow) — some content is cached, but not all upcoming lessons.
- **"Sync needed"** (red) — no upcoming content is cached; the next session may hit dead ends.

A manual **"Prepare for Offline"** button allows the user to trigger a full sync before entering the subway. Tapping it runs the entire pre-cache pipeline and shows a progress bar.

---

## 7. Background Sync

When the user completes actions offline (challenge submissions, card reviews, XP earned), those actions are queued in IndexedDB and need to be sent to the server when connectivity returns.

### Background Sync API

The Background Sync API allows a service worker to defer actions until the device has a stable connection:

```javascript
// In the app: register a sync event
async function queueSync(action: SyncAction) {
  const db = await openDB('learner-db', 1);
  await db.add('sync-queue', action);

  const reg = await navigator.serviceWorker.ready;
  await reg.sync.register('learner-sync');
}

// In sw.js: handle the sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'learner-sync') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const db = await openDB('learner-db', 1);
  const queue = await db.getAll('sync-queue');

  for (const action of queue) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify(action),
      });
      await db.delete('sync-queue', action.id);
    } catch {
      // Will retry on next sync event
      break;
    }
  }
}
```

### Sync Action Types

```typescript
type SyncAction = {
  id: number;                          // Auto-increment from IndexedDB
  type: 'progress-update'             // Node completion, status change
      | 'challenge-submission'         // Full submission with code + results
      | 'card-review'                  // FSRS card state update
      | 'xp-update'                    // XP earned, level changes
      | 'session-log'                  // Complete session analytics
      | 'ai-review-request';           // Code review queued for AI processing
  payload: unknown;
  timestamp: Date;
  retries: number;                     // Increment on each failed attempt, abandon after 5
  status: 'pending' | 'syncing' | 'failed';
};
```

### iOS Fallback

Safari does not support the Background Sync API. The fallback strategy:

1. Listen for the `online` event on `window`.
2. When connectivity is restored, process the sync queue from the main thread.
3. On each app open, check if there are pending sync actions and process them.

This is slightly less reliable than Background Sync (the sync only happens when the app is open), but for Learner's use case — where the user opens the app at least once per day — it is entirely sufficient.

---

## 8. Push Notifications (Streak Reminders)

Streaks are one of Learner's core engagement mechanics (see research doc 01 on gamification). A push notification reminding the user to maintain their streak is the single highest-value notification the app can send.

### Implementation

The Web Push API sends notifications even when the app is not open. It requires:

1. **User permission** — the app must call `Notification.requestPermission()` and the user must tap "Allow."
2. **Push subscription** — the service worker subscribes to a push service (using VAPID keys) and sends the subscription endpoint to the backend.
3. **Server-side push** — the backend sends a push message to the subscription endpoint at the scheduled time.

### Permission Request Timing

Asking for notification permission on first visit is aggressive and leads to high denial rates. Learner delays the request until the user has demonstrated commitment:

- **Trigger: 3-day streak reached** — the user has returned three days in a row, proving genuine interest.
- **Message:** "Want streak reminders? We'll nudge you if you haven't practiced today."
- **Never re-ask** if denied — the option lives in Settings for users who change their mind.

### Schedule

The default reminder fires at 8:00 PM local time if the user has not completed any activity that day. The time is configurable in settings. The notification reads:

> "Your 12-day streak is on the line! A quick 5-minute review keeps it alive."

Tapping the notification opens the app directly to the spaced repetition review deck — the fastest path to preserving the streak.

### iOS Considerations

Web Push on iOS requires:
- iOS 16.4 or later.
- The PWA must be installed (added to home screen). Push does not work from Safari browser.
- The user must grant permission through the standard iOS permission dialog.

For users on older iOS versions, the fallback is an in-app notification banner shown on next open: "You almost lost your streak yesterday! Review now to keep it going."

---

## 9. Performance Optimization

A PWA that takes 10 seconds to load is not going to replace a native app. Performance must be aggressive.

### First Load Budget

The first time a user visits the app (no cache), the total download is approximately:

| Asset | Size (Compressed) |
|---|---|
| Next.js app shell (HTML + CSS + JS) | ~250KB |
| Pyodide WASM + core packages | ~11MB |
| Initial lesson content (first 3 lessons) | ~600KB |
| Icons, splash screens, manifest | ~100KB |
| **Total** | **~12MB** |

On a 10 Mbps connection (typical NYC WiFi), this takes ~10 seconds. The app shows a branded progress bar during initial load with the message: "Setting up your offline coding environment..." Pyodide is loaded lazily — the app shell renders immediately, and Pyodide downloads in the background only when the user first opens a code playground.

### Subsequent Loads

After the first visit, everything is cached. The app loads in under 2 seconds:

- **0-200ms:** Service worker intercepts navigation, serves cached HTML.
- **200-500ms:** Cached JS bundles execute, React hydrates.
- **500-1000ms:** Zustand reads state from IndexedDB, dashboard renders.
- **1000-1500ms:** Route-specific content loads from cache.

### Optimization Techniques

**Lazy-load Pyodide** — Pyodide is never loaded until the user actually opens a code editor. Most app interactions (reading lessons, reviewing cards, browsing the skill tree) do not need Python execution. This keeps the initial interactive time under 2 seconds.

**Code splitting** — Next.js App Router automatically code-splits by route. Each page (dashboard, lesson, challenge, review, settings) is a separate JS chunk. Navigating to a page loads only that page's code. The service worker pre-caches all route chunks during install, so navigation is instant offline.

**System font stack** — no web font downloads. The CSS uses:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
  Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

For code blocks, the monospace stack uses system monospace fonts with `JetBrains Mono` as an optional enhancement (loaded async if available in cache).

**Inline SVGs** — all illustrations and diagrams are SVG, inlined in the MDX or rendered as React components. No external image requests.

**Image-free design** — the app uses CSS gradients, borders, shadows, and SVG icons exclusively. No raster images except for the app icon (which is cached with the manifest). This eliminates image loading as a performance concern entirely.

**Lighthouse target: 100** — the app targets a perfect Lighthouse PWA score. This requires: valid manifest, registered service worker, HTTPS, responsive design, offline fallback page, and adequate icon sizes.

---

## 10. Testing Offline Behavior

Offline functionality is invisible when it works and catastrophic when it breaks. Testing must be systematic and regular.

### Chrome DevTools Testing

1. Open DevTools (F12) > Application tab > Service Workers: verify the worker is registered, active, and controlling the page.
2. Network tab > toggle "Offline": the app should continue functioning with zero errors in the console.
3. Application tab > Cache Storage: verify all expected caches exist and contain the right assets.
4. Application tab > IndexedDB: inspect `learner-db` stores, verify data integrity.

### Testing Checklist

- [ ] App loads when device is in airplane mode
- [ ] Dashboard displays correct XP, level, streak from IndexedDB
- [ ] Lesson content renders fully offline (text, code blocks, diagrams)
- [ ] Code playground loads Pyodide from cache (2-3s, not 10s+)
- [ ] User can write and run Python code with output displayed
- [ ] Challenge submission runs all test cases and displays results
- [ ] XP is awarded and persisted to IndexedDB after challenge completion
- [ ] Spaced repetition deck loads due cards from IndexedDB
- [ ] Card reviews update FSRS state in IndexedDB
- [ ] Pre-cached AI hints display when requested
- [ ] Uncached AI hints show graceful fallback message
- [ ] AI tutor chat shows "requires internet" message (not an error)
- [ ] "Prepare for Offline" button triggers pre-cache pipeline
- [ ] Progress syncs to server when connectivity is restored
- [ ] Sync queue handles retries and does not duplicate actions
- [ ] App update triggers new service worker install and cache refresh
- [ ] No console errors in offline mode

### Real-World Testing Protocol

Chrome DevTools offline mode is a good start, but it does not replicate subway conditions. The definitive test:

1. Connect to WiFi. Open Learner. Tap "Prepare for Offline."
2. Wait for the green "Ready for offline" indicator.
3. Enable airplane mode. Close the app completely (swipe away from recents).
4. Re-open the app from the home screen icon.
5. Complete an entire session: read a lesson, solve a challenge, review 5 cards.
6. Disable airplane mode.
7. Verify that all progress appears on the server (or in a second browser tab logged into the same account).

This test should be run on both iOS Safari and Chrome Android before every major release.

---

## 11. Next.js PWA Integration

### Option A: `next-pwa` Package

The `@ducanh2912/next-pwa` package (the actively maintained fork) integrates with Next.js App Router and auto-generates a service worker using Workbox:

```typescript
// next.config.ts
import withPWA from '@ducanh2912/next-pwa';

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'learner-pyodide-v1',
        expiration: { maxEntries: 50, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/api\/hints/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'learner-ai-cache-v1',
        expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
})({
  // Normal Next.js config
  reactStrictMode: true,
});

export default config;
```

**Pros:** fast to set up, battle-tested Workbox caching strategies, automatic precaching of Next.js build output, handles cache invalidation on deploy.

**Cons:** less control over the service worker internals, Workbox adds ~15KB to the service worker, debugging generated code is harder than debugging handwritten code.

### Option B: Manual Service Worker

Write `/public/sw.js` by hand and register it in a client component. Full control over every cache operation, fetch handler, and sync event.

**Pros:** complete transparency, no dependencies, smaller service worker file, easier to debug.

**Cons:** must manually handle pre-caching of Next.js build assets (which change hashes on every build), must implement cache versioning and cleanup manually, more code to maintain.

### Recommendation

**Start with `next-pwa`**, then graduate to a manual service worker if customization needs exceed what the package offers. The package handles the tedious parts (precaching hashed build assets, cleaning old caches) while allowing custom runtime caching rules for Pyodide and AI hints. The 15KB overhead is negligible against the 11MB Pyodide bundle.

The critical gotcha with Next.js App Router and service workers: App Router uses React Server Components by default, which generate HTML on the server. The service worker must cache these server-rendered responses correctly. `next-pwa` handles this automatically. A manual service worker needs explicit handling of the RSC payload format (which is a streaming JSON-like format, not standard HTML).

### Development Workflow

Service workers are aggressive about caching, which can make development frustrating (changes do not appear because the old version is cached). Best practices:

- **Disable service worker in development** — `next-pwa` does this by default when `process.env.NODE_ENV === 'development'`.
- **Use Chrome DevTools "Update on reload"** — Application tab > Service Workers > check "Update on reload" to force the latest version on every page load during testing.
- **Hard refresh** — Ctrl+Shift+R (or Cmd+Shift+R) bypasses the service worker cache.

---

## Application to Learner

The offline-first architecture described in this document is not a nice-to-have feature bolted onto the app after launch. It is the foundational technical constraint that shapes every architectural decision.

### Service Worker Configuration

The service worker uses a tiered caching strategy with five named caches. The app shell and Pyodide are cached with maximum durability (cache-first, long expiration). Lesson content uses cache-first with background refresh. AI-generated hints are pre-cached in IndexedDB during WiFi sync and served instantly offline. Live AI chat is the only feature that degrades gracefully to a fallback message.

### IndexedDB Schema

Six object stores cover all application state: user profile, curriculum progress, FSRS review cards, AI hint cache, session history, and the sync queue. Zustand persists to IndexedDB via a custom storage adapter built on `idb-keyval`. Structured queries (cards due today, nodes by status) use indexed stores via the full `idb` library.

### Sync Strategy

All user actions during offline sessions are recorded in a sync queue with typed payloads (`progress-update`, `challenge-submission`, `card-review`, `xp-update`, `session-log`, `ai-review-request`). The queue processes via the Background Sync API on Chromium browsers and via `online` event detection on Safari. Failed actions retry up to 5 times before being marked as failed and surfaced to the user.

### Pre-Cache Pipeline

On WiFi, the app pre-downloads the next 10 lessons (~2MB), pre-generates AI hints for the next 10 challenges (~50KB), syncs progress to the cloud, and checks for content updates. A visible "Ready for offline" indicator gives the user confidence before entering the subway. A manual "Prepare for Offline" button provides explicit control. Storage is managed by evicting lessons completed more than 20 sessions ago while keeping Pyodide cached indefinitely.

The result: a developer opens the app on the A train at 59th Street. By the time they reach Chambers Street, they have completed a lesson on closures, solved two challenges, reviewed 8 flashcards, and earned 150 XP. They never saw a spinner, never hit a dead end, and never knew they were offline.
