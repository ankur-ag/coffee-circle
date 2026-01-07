import { bookingConfirmationHTML, cancellationConfirmationHTML, reminderEmailHTML } from "./email-templates";
import { LOCATION_REVEAL_DAYS } from "./config";
import { differenceInDays } from "date-fns";

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

/**
 * Centrally formats the location name to include the table name
 * only if there are multiple tables.
 */
function formatLocationName(locationName: string, tableName?: string, hasMultipleTables?: boolean): string {
    if (hasMultipleTables && tableName && tableName !== "Table 1") {
        return `${locationName} (${tableName})`;
    }
    return locationName;
}

export async function sendBookingConfirmation(details: {
    to: string;
    userName: string;
    eventDate: string;
    eventTime: string;
    locationName: string;
    locationAddress: string;
    locationCity: string;
    tableName?: string;
    hasMultipleTables?: boolean;
}) {
    // Check if location should be revealed based on event date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(details.eventDate);
    eventDate.setHours(0, 0, 0, 0);

    const daysUntilEvent = differenceInDays(eventDate, today);
    const shouldRevealLocation = daysUntilEvent <= LOCATION_REVEAL_DAYS;

    return sendEmail(
        details.to,
        "Your Coffee Meetup is Confirmed! ☕",
        bookingConfirmationHTML({
            ...details,
            locationName: formatLocationName(details.locationName, details.tableName, details.hasMultipleTables),
            shouldRevealLocation,
        })
    );
}

export async function sendCancellationConfirmation(details: {
    to: string;
    userName: string;
    eventDate: string;
    eventTime: string;
    locationName: string;
    locationCity: string;
    tableName?: string;
    hasMultipleTables?: boolean;
}) {
    return sendEmail(
        details.to,
        "Your Coffee Meetup Reservation has been Cancelled",
        cancellationConfirmationHTML({
            ...details,
            locationName: formatLocationName(details.locationName, details.tableName, details.hasMultipleTables),
        })
    );
}

export async function sendReminderEmail(details: {
    to: string;
    userName: string;
    eventDate: string;
    eventTime: string;
    locationName: string;
    locationAddress: string;
    locationCity: string;
    tableName?: string;
    hasMultipleTables?: boolean;
}) {
    return sendEmail(
        details.to,
        "Reminder: Your Coffee Meetup is in 2 days! ☕",
        reminderEmailHTML({
            ...details,
            locationName: formatLocationName(details.locationName, details.tableName, details.hasMultipleTables),
        })
    );
}
