import { NextResponse } from "next/server";
import { getEventsWithAttendees } from "@/lib/data";
import { sendReminderEmail } from "@/lib/email";
import { REMINDER_EMAIL_DAYS, SAME_DAY_REMINDER_DAYS } from "@/lib/config";
import { format } from "date-fns";

// Use Node.js runtime for better database connection performance
// Edge Runtime has cold starts and slower database connections
// Node.js runtime provides better connection pooling
// export const runtime = "edge";

export async function GET(request: Request) {
    // Optional: Add authentication/authorization check
    // For example, check for a secret token in headers or query params
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const daysToProcess = [REMINDER_EMAIL_DAYS, SAME_DAY_REMINDER_DAYS];
        console.log(`Starting reminder email process for day offsets: ${daysToProcess.join(", ")}`);

        let totalEmailsSent = 0;
        let totalEmailsFailed = 0;
        let totalEventsProcessed = 0;

        for (const days of daysToProcess) {
            console.log(`Processing reminders for ${days} days from now...`);
            const targetEvents = await getEventsWithAttendees(days);

            if (targetEvents.length === 0) {
                console.log(`No events found for ${days} days from now`);
                continue;
            }

            totalEventsProcessed += targetEvents.length;

            // Send reminder emails for each event
            for (const event of targetEvents) {
                console.log(`Processing event: ${event.date} at ${event.time} (${event.bookings.length} bookings)`);

                for (const booking of event.bookings) {
                    const user = booking.user;

                    if (!user?.email || !user?.name) {
                        console.warn(`Skipping booking ${booking.id} - missing user email or name`);
                        continue;
                    }

                    try {
                        await sendReminderEmail({
                            to: user.email,
                            userName: user.name,
                            eventDate: format(new Date(event.date), "EEEE, MMMM d, yyyy"),
                            eventTime: event.time,
                            locationName: event.location?.name || "TBD",
                            locationAddress: event.location?.location || "TBD",
                            locationCity: event.location?.city || "TBD",
                            tableName: event.tableName,
                            hasMultipleTables: (event as any).hasMultipleTables,
                            daysUntil: days,
                        });

                        totalEmailsSent++;
                        console.log(`✓ Sent reminder to ${user.email}`);
                    } catch (error) {
                        totalEmailsFailed++;
                        console.error(`Failed to send reminder to ${user.email}:`, error);
                    }
                }
            }
        }

        console.log(`Reminder email process completed. Total Sent: ${totalEmailsSent}, Failed: ${totalEmailsFailed}`);

        return NextResponse.json({
            success: true,
            message: "Reminder emails processed",
            emailsSent: totalEmailsSent,
            emailsFailed: totalEmailsFailed,
            eventsProcessed: totalEventsProcessed,
        });
    } catch (error) {
        console.error("Error processing reminder emails:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

