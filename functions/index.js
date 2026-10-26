const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { defineString } = require("firebase-functions/params");
const { Resend } = require("resend");

// Define the API key parameter
// This will be prompted for during deployment if not set
const resendKeyParam = defineString("RESEND_KEY");

/**
 * HTTP Cloud Function to send emails
 * Endpoint: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/sendEmail
 */
exports.sendEmail = onRequest({
    cors: true,
    invoker: "public",
}, async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Initialize Resend with the parameter value
    const apiKey = resendKeyParam.value();
    if (!apiKey) {
        console.error("Resend API key not configured!");
        return res.status(500).json({
            error: "Email service not configured. RESEND_KEY parameter is missing.",
        });
    }
    const resend = new Resend(apiKey);

    try {
        const { to, cc, subject, html } = req.body;

        // Validate required fields
        if (!to || !subject || !html) {
            return res.status(400).json({
                error: "Missing required fields: to, subject, html",
            });
        }

        console.log("Sending email to:", to);
        if (cc) console.log("CC:", cc);
        console.log("Subject:", subject);

        // Send email using Resend
        const payload = {
            from: "noreply@notifications.engsight.app",
            to: Array.isArray(to) ? to : [to],
            subject: subject,
            html: html,
        };

        if (cc) {
            payload.cc = Array.isArray(cc) ? cc : [cc];
        }

        const data = await resend.emails.send(payload);

        console.log("Email sent successfully:", data);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({
            error: error.message || "Failed to send email",
        });
    }
});

initializeApp();

const APP_URL = "https://tinytime.engsight.app";
const DEAD_TOKEN_CODES = [
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
];

/**
 * Push-notifies whoever is waiting on the other party.
 * Tokens are stored on the event by the client when a user taps "Notify me".
 */
exports.pushNotify = onDocumentUpdated("events/{eventId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (before.status === after.status) return;

    const { eventId } = event.params;
    let field;
    let title;
    if (after.status === "negotiating") {
        field = "hostPushTokens";
        title = "New times proposed";
    } else if (after.status === "confirmed") {
        // Whoever confirmed already knows; tell the other side.
        field = before.status === "negotiating" ?
            "guestPushTokens" : "hostPushTokens";
        title = "Playdate confirmed!";
    } else {
        return;
    }

    const tokens = after[field] || [];
    if (tokens.length === 0) return;

    // Data-only so public/sw.js controls how the notification looks.
    const res = await getMessaging().sendEachForMulticast({
        tokens,
        data: {
            title,
            body: after.title || "Your playdate",
            url: `${APP_URL}/?eventId=${eventId}`,
            eventId,
        },
        webpush: { headers: { Urgency: "high" } },
    });

    const dead = tokens.filter((_, i) =>
        DEAD_TOKEN_CODES.includes(res.responses[i].error?.code));
    if (dead.length > 0) {
        await getFirestore().doc(`events/${eventId}`)
            .update({ [field]: FieldValue.arrayRemove(...dead) });
    }
});
