# 0001. Load heavy SDKs lazily and cache for offline use

## Context
The landing page must load fast on phones. Firestore and the messaging SDK are large. Users also reopen events offline.

## Decision
- Import Firestore on demand in `src/lib/db.js`, so the landing page does not download it.
- Import the messaging SDK on demand in `src/lib/push.js`, to keep it out of the main bundle.
- Enable the IndexedDB cache in `src/lib/firebase.js`, so events opened before still load offline.
- The service worker (`public/sw.js`) uses these rules:
  - Bump `CACHE` on deploy to drop old caches.
  - Never intercept non-GET or cross-origin requests. Firestore and Functions always hit the network.
  - Pages are network-first, so deploys show at once. The cached shell serves offline.
  - Vite assets are content-hashed, so they are cache-first.
  - Push messages arrive as FCM data-only messages, so `sw.js` controls how the notification looks.

## Consequences
First use of Firestore or push waits for a dynamic import. The cache name must change on every deploy that changes the shell.
