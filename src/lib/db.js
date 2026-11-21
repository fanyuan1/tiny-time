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

export const updateEventStatus = async (eventId, status, confirmedSlot = null, guestEmail = null) => {
    try {
        const { db, doc, getDoc, updateDoc } = await firestore();
        const eventRef = doc(db, "events", eventId);
        const updateData = {
            status: status,
            confirmedSlot: confirmedSlot,
        };
        if (guestEmail) {
            updateData.guestEmail = guestEmail;
        }
        await updateDoc(eventRef, updateData);

        if (status === 'confirmed') {
            const eventDoc = await getDoc(eventRef);
            const event = { id: eventId, ...eventDoc.data() };
            await sendConfirmationEmails(event);
        }
    } catch (e) {
        console.error("Error updating status: ", e);
        throw e;
    }
};

export const addProposal = async (eventId, proposedSlots, proposerEmail, duration) => {
    try {
        const { db, doc, getDoc, updateDoc } = await firestore();
        const eventRef = doc(db, "events", eventId);
        const updateData = {
            proposedSlots: proposedSlots,
            status: "negotiating",
            updatedAt: new Date().toISOString()
        };

        if (duration) {
            updateData.duration = duration;
        }

        updateData.guestEmail = proposerEmail;

        await updateDoc(eventRef, updateData);

        const eventDoc = await getDoc(eventRef);
        const event = { id: eventId, ...eventDoc.data() };

        await sendProposalNotificationEmail(event);
    } catch (e) {
        console.error("Error adding proposal: ", e);
        throw e;
    }
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
