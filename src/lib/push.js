import { addPushToken } from "./db";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// iOS only exposes PushManager once the app is installed to the home screen.
export const pushSupported = () =>
    import.meta.env.PROD &&
    !!VAPID_KEY &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

/**
 * Asks for permission and registers this device for push on one event.
 * role is "host" or "guest" and decides which updates this device hears about.
 */
export const enablePush = async (eventId, role) => {
    // Loaded on demand so the messaging SDK stays out of the main bundle.
    const [{ getMessaging, getToken, isSupported }, { app }] = await Promise.all([
        import("firebase/messaging"),
        import("./firebase"),
    ]);
    if (!(await isSupported())) throw new Error("Push is not supported in this browser.");

    const token = await getToken(getMessaging(app), {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });
    await addPushToken(eventId, role, token);
};
