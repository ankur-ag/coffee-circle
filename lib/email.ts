import { bookingConfirmationHTML, cancellationConfirmationHTML } from "./email-templates";

// Lightweight email sending using Resend API directly (no SDK needed)
async function sendEmail(to: string, subject: string, html: string) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "Coffee Circle <onboarding@resend.dev>";

    if (!apiKey) {
        console.warn("[Email] RESEND_API_KEY not set, skipping email");
        return { success: false, error: "API key not configured" };
    }

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject,
                html,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[Email] API error:", error);
            return { success: false, error };
        }

        const data = await response.json() as { id: string };
        console.log("[Email] Sent successfully:", data.id);
        return { success: true, data };
    } catch (error) {
        console.error("[Email] Exception:", error);
        return { success: false, error };
    }
}

export async function sendBookingConfirmation(details: {
    to: string;
    userName: string;
    eventDate: string;
    eventTime: string;
    locationName: string;
    locationAddress: string;
    locationCity: string;
}) {
    return sendEmail(
        details.to,
        "Your Coffee Meetup is Confirmed! ☕",
        bookingConfirmationHTML(details)
    );
}

export async function sendCancellationConfirmation(details: {
    to: string;
    userName: string;
    eventDate: string;
    eventTime: string;
    locationName: string;
    locationCity: string;
}) {
    return sendEmail(
        details.to,
        "Your Coffee Meetup Reservation has been Cancelled",
        cancellationConfirmationHTML(details)
    );
}
