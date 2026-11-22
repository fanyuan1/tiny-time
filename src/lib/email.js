import {
    guestInviteTemplate,
    hostProposalTemplate,
    confirmationTemplate
} from './emailTemplates';

const FROM_EMAIL = 'noreply@notifications.engsight.app'

const CLOUD_FUNCTION_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL || 'https://us-central1-tiny-time-9000.cloudfunctions.net/sendEmail';

const sendEmail = async (to, subject, htmlContent, cc = null) => {
    try {

        const body = {
            to,
            subject,
            html: htmlContent
        };

        if (cc) {
            body.cc = cc;
        }

        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send email');
        }

        const data = await response.json();
        return { success: true, data };

    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return { success: false, error: error.message };
    }
};

export const sendEventCreatedEmail = async (event, shareUrl) => {
    let to = event.hostEmail;
    let cc = null;

    if (event.guestEmail) {
        to = event.guestEmail;
        cc = event.hostEmail;
    }

    const subject = `📅 You're invited to a playdate: ${event.title}`;
    const html = guestInviteTemplate(event, shareUrl);
    return await sendEmail(to, subject, html, cc);
};

export const sendProposalNotificationEmail = async (event) => {
    const to = event.hostEmail;
    let cc = null;

    if (event.guestEmail) {
        cc = event.guestEmail;
    }

    const subject = `💡 New time proposal for: ${event.title}`;
    const html = hostProposalTemplate(event);
    return await sendEmail(to, subject, html, cc);
};

export const sendConfirmationEmails = async (event) => {
    const subject = `✅ Playdate confirmed: ${event.title}`;
    const html = confirmationTemplate(event);

    const recipients = [event.hostEmail];
    if (event.guestEmail) {
        recipients.push(event.guestEmail);
    }

    return await sendEmail(recipients, subject, html);
};
