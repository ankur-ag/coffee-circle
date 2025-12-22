import { NextResponse } from "next/server";
import { getEventsWithAttendees } from "@/lib/data";
import { sendReminderEmail } from "@/lib/email";
import { REMINDER_EMAIL_DAYS } from "@/lib/config";
import { format } from "date-fns";

export const runtime = "edge";

export async function GET(request: Request) {
    // Optional: Add authentication/authorization check
    // For example, check for a secret token in headers or query params
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log(`Starting reminder email process for events ${REMINDER_EMAIL_DAYS} days from now...`);
        
        // Get all events happening in REMINDER_EMAIL_DAYS with their attendees
        const targetEvents = await getEventsWithAttendees(REMINDER_EMAIL_DAYS);
        
        if (targetEvents.length === 0) {
            console.log(`No events found for ${REMINDER_EMAIL_DAYS} days from now`);
            return NextResponse.json({ 
                success: true, 
                message: `No events found for ${REMINDER_EMAIL_DAYS} days from now`,
                emailsSent: 0 
            });
        }

        let emailsSent = 0;
        let emailsFailed = 0;

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
                    });
                    
                    emailsSent++;
                    console.log(`✓ Sent reminder to ${user.email}`);
                } catch (error) {
                    emailsFailed++;
                    console.error(`Failed to send reminder to ${user.email}:`, error);
                }
            }
        }

        console.log(`Reminder email process completed. Sent: ${emailsSent}, Failed: ${emailsFailed}`);

        return NextResponse.json({
            success: true,
            message: "Reminder emails processed",
            emailsSent,
            emailsFailed,
            eventsProcessed: tomorrowEvents.length,
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
