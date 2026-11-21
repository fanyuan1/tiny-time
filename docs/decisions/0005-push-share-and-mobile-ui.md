# 0005. Push, sharing, and mobile UI conventions

## Context
TinyTime is used mostly on phones, installed as a PWA.

## Decision
- iOS exposes `PushManager` only after the app is installed to the home screen, so `push.js` checks for it.
- `push.js` asks for permission and registers the device for one event. The role (host or guest) decides which updates the device hears about.
- The client stores tokens on the event when a user taps "Notify me". `pushNotify` reads them and notifies whoever waits on the other party. Whoever confirmed already knows.
- Sharing uses the OS share sheet and returns false if the user cancels or it is unavailable. It falls back where the Clipboard API is missing or blocked (some older mobile browsers).
- Primary actions stay in thumb reach on phones, with a plain flow on larger screens (`STICKY_ACTIONS` in `Home.jsx`).
- The header is white and blurred to blend with the white status bar (theme-color).

## Consequences
Push is unavailable on iOS Safari tabs that are not installed.
