import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { meetups, coffeeShops, bookings, users } from "../lib/schema";
import { eq, and } from "drizzle-orm";
import * as schema from "../lib/schema";

async function testReminder() {
    console.log("Setting up data for reminder testing...");

    const db = drizzle(sql, { schema });

    // 1. Get a location
    const locations = await db.select().from(coffeeShops).limit(1);
    if (locations.length === 0) {
        console.error("No locations found. Please run npm run seed first.");
        process.exit(1);
    }
    const location = locations[0];

    // 2. Calculate "Today + 2 days"
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    const dateStr = targetDate.toISOString().split("T")[0];

    console.log(`Target date for reminder: ${dateStr}`);

    // 3. Check for existing event
    let event = await db.select().from(meetups).where(
        and(
            eq(meetups.date, dateStr),
            eq(meetups.locationId, location.id)
        )
    ).limit(1);

    let eventId: string;
    if (event.length === 0) {
        eventId = crypto.randomUUID();
        await db.insert(meetups).values({
            id: eventId,
            date: dateStr,
            time: "14:00",
            locationId: location.id,
            status: "open",
        });
        console.log(`✓ Created event for ${dateStr}`);
    } else {
        eventId = event[0].id;
        console.log(`✓ Using existing event for ${dateStr}`);
    }

    // 4. Create/Get test user
    const testEmail = "test-reminder@example.com";
    let testUser = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);

    let userId: string;
    if (testUser.length === 0) {
        userId = crypto.randomUUID();
        await db.insert(users).values({
            id: userId,
            email: testEmail,
            name: "Test Reminder User",
        });
        console.log(`✓ Created test user: ${testEmail}`);
    } else {
        userId = testUser[0].id;
        console.log(`✓ Using existing test user: ${testEmail}`);
    }

    // 5. Create booking if not exists
    const existingBooking = await db.select().from(bookings).where(
        and(
            eq(bookings.userId, userId),
            eq(bookings.meetupId, eventId)
        )
    ).limit(1);

    if (existingBooking.length === 0) {
        await db.insert(bookings).values({
            id: crypto.randomUUID(),
            userId: userId,
            meetupId: eventId,
            vibe: "social",
            status: "confirmed",
        });
        console.log("✓ Created booking for test user");
    } else {
        console.log("✓ Test user already has a booking for this event");
    }

    console.log("\n--- TEST READY ---");
    console.log(`Event Date: ${dateStr}`);
    console.log(`User Email: ${testEmail}`);
    console.log("\nTo trigger the reminders locally, run:");
    console.log("curl -X GET http://localhost:3000/api/send-reminders");
    if (process.env.CRON_SECRET) {
        console.log(`  -H "Authorization: Bearer ${process.env.CRON_SECRET}"`);
    }
    console.log("\nIf you want to test with YOUR REAL EMAIL, edit this script or add a booking for your email on this date.");

    process.exit(0);
}

testReminder().catch(err => {
    console.error(err);
    process.exit(1);
});
