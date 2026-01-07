import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { meetups, coffeeShops, bookings, users } from "../lib/schema";
import { sendReminderEmail } from "../lib/email";
import { eq, and } from "drizzle-orm";
import * as schema from "../lib/schema";
import { format } from "date-fns";

async function triggerRealEmail() {
    console.log("Preparing to trigger a real reminder email...");

    const db = drizzle(sql, { schema });

    // 1. Get the target user
    const userEmail = "outlaws01@gmail.com";
    const userRecords = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);

    if (userRecords.length === 0) {
        console.error(`User ${userEmail} not found in database.`);
        process.exit(1);
    }
    const user = userRecords[0];

    // 2. Get the test event on 2026-01-09
    const dateStr = "2026-01-09";
    const eventRecords = await db.select({
        id: meetups.id,
        date: meetups.date,
        time: meetups.time,
        location: coffeeShops
    })
        .from(meetups)
        .innerJoin(coffeeShops, eq(meetups.locationId, coffeeShops.id))
        .where(eq(meetups.date, dateStr))
        .limit(1);

    if (eventRecords.length === 0) {
        console.error(`Test event for ${dateStr} not found. Please run scripts/test-reminder.ts first.`);
        process.exit(1);
    }
    const event = eventRecords[0];

    // 3. Ensure booking exists for this user
    const bookingRecords = await db.select().from(bookings).where(
        and(
            eq(bookings.userId, user.id),
            eq(bookings.meetupId, event.id)
        )
    ).limit(1);

    if (bookingRecords.length === 0) {
        console.log(`Creating booking for ${userEmail}...`);
        await db.insert(bookings).values({
            id: crypto.randomUUID(),
            userId: user.id,
            meetupId: event.id,
            vibe: "social",
            status: "confirmed",
        });
    }

    // 4. Trigger the email directly
    console.log(`Sending real reminder email to ${userEmail} for event on ${dateStr}...`);

    try {
        const result = await sendReminderEmail({
            to: user.email,
            userName: user.name || "User",
            eventDate: format(new Date(event.date), "EEEE, MMMM d, yyyy"),
            eventTime: event.time,
            locationName: event.location?.name || "TBD",
            locationAddress: event.location?.location || "TBD",
            locationCity: event.location?.city || "TBD",
            tableName: "Table 2",
            hasMultipleTables: true,
        });

        if (result.success) {
            console.log("✓ Email sent successfully via Resend!");
        } else {
            console.error("✗ Failed to send email:", result.error);
        }
    } catch (error) {
        console.error("✗ Error in email triggering:", error);
    }

    process.exit(0);
}

triggerRealEmail().catch(err => {
    console.error(err);
    process.exit(1);
});
