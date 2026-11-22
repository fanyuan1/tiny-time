import { nanoid } from "nanoid";
import {
    sendEventCreatedEmail,
    sendProposalNotificationEmail,
    sendConfirmationEmails
} from "./email";

const firestore = async () => {
    const [{ db }, fs] = await Promise.all([import("./firebase"), import("firebase/firestore")]);
    return { db, ...fs };
};

export const createEvent = async (eventData) => {
    try {
        const { db, doc, setDoc, Timestamp } = await firestore();
        const { settings, ...rest } = eventData;
        const duration = eventData.duration || settings?.interval || 30;

        const eventId = nanoid(10);
        const docRef = doc(db, "events", eventId);
        
        await setDoc(docRef, {
            ...rest,
            duration,
            createdAt: Timestamp.now(),
            status: "pending",
            guestEmail: eventData.guestEmail || null,
            confirmedSlot: null
        });
        const event = { id: eventId, ...rest, duration, guestEmail: eventData.guestEmail || null };
        const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?eventId=${eventId}`;

        await sendEventCreatedEmail(event, shareUrl);

        return eventId;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const getEvent = async (eventId) => {
    try {
        const { db, doc, getDoc } = await firestore();
        const docRef = doc(db, "events", eventId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (e) {
        console.error("Error getting document: ", e);
        throw e;
    }
};

const sameEmail = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

const readEvent = async (eventId) => {
    const { db, doc, getDoc, updateDoc } = await firestore();
    const eventRef = doc(db, "events", eventId);
    const snapshot = await getDoc(eventRef);
    if (!snapshot.exists()) throw new Error("Event not found.");
    return { eventRef, event: { id: eventId, ...snapshot.data() }, getDoc, updateDoc };
};

export const confirmerRole = (event) => (event.status === "negotiating" ? "host" : "guest");

export const confirmEvent = async (eventId, confirmedSlot, confirmerEmail) => {
    const { eventRef, event, getDoc, updateDoc } = await readEvent(eventId);
    if (event.status === "confirmed" || event.status === "closed") {
        throw new Error("This event can no longer be confirmed.");
    }
    const role = confirmerRole(event);
    const proposerEmail = role === "host" ? event.guestEmail : event.hostEmail;
    if (sameEmail(confirmerEmail, proposerEmail)) {
        throw new Error("You proposed these times. The other parent must confirm them.");
    }
    await updateDoc(eventRef, {
        status: "confirmed",
        confirmedSlot,
        [role === "host" ? "hostEmail" : "guestEmail"]: confirmerEmail.trim(),
    });
    const confirmed = await getDoc(eventRef);
    await sendConfirmationEmails({ id: eventId, ...confirmed.data() });
};

export const addProposal = async (eventId, proposedSlots, guestEmail, duration) => {
    const { eventRef, event, getDoc, updateDoc } = await readEvent(eventId);
    if (event.status !== "pending") {
        throw new Error("New times can only be proposed once, before anyone confirms.");
    }
    if (sameEmail(guestEmail, event.hostEmail)) {
        throw new Error("The host cannot propose new times. Use the guest's email.");
    }
    await updateDoc(eventRef, {
        proposedSlots,
        status: "negotiating",
        guestEmail: guestEmail.trim(),
        updatedAt: new Date().toISOString(),
        ...(duration && { duration }),
    });
    const proposed = await getDoc(eventRef);
    await sendProposalNotificationEmail({ id: eventId, ...proposed.data() });
};

export const closeEvent = async (eventId) => {
    const { eventRef, updateDoc } = await readEvent(eventId);
    await updateDoc(eventRef, { status: "closed", updatedAt: new Date().toISOString() });
};

export const updateEventDetails = async (eventId, updates) => {
    try {
        const { db, doc, updateDoc } = await firestore();
        const eventRef = doc(db, "events", eventId);

        const updateData = {
            updatedAt: new Date().toISOString()
        };

        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.location !== undefined) updateData.location = updates.location;
        if (updates.hostEmail !== undefined) updateData.hostEmail = updates.hostEmail;
        if (updates.guestEmail !== undefined) updateData.guestEmail = updates.guestEmail;
        if (updates.duration !== undefined) updateData.duration = updates.duration;

        await updateDoc(eventRef, updateData);
    } catch (e) {
        console.error("Error updating event details: ", e);
        throw e;
    }
};

export const addPushToken = async (eventId, role, token) => {
    const { db, doc, updateDoc, arrayUnion } = await firestore();
    const field = role === "host" ? "hostPushTokens" : "guestPushTokens";
    await updateDoc(doc(db, "events", eventId), { [field]: arrayUnion(token) });
};
