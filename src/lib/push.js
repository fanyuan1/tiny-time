import { addPushToken } from "./db";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const pushSupported = () =>
    import.meta.env.PROD &&
    Boolean(VAPID_KEY) &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

export const enablePush = async (eventId, role) => {
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
