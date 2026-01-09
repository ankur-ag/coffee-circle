import { config } from "dotenv";
config({ path: ".env.local" });

import { getDb } from "../lib/db";
import { meetups, coffeeShops, bookings, users } from "../lib/schema";
import { eq, and } from "drizzle-orm";
import * as schema from "../lib/schema";

async function testTodayReminder() {
    console.log("Setting up data for SAME-DAY reminder testing...");

    const db = getDb();

    // 1. Get a location
    const locations = await db.select().from(coffeeShops).limit(1);
    if (locations.length === 0) {
        console.error("No locations found.");
        process.exit(1);
    }
    const location = locations[0];

    // 2. Today's date
    const dateStr = new Date().toISOString().split("T")[0];
    console.log(`Target date (Today): ${dateStr}`);

    // 3. Create/Get event
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
        console.log(`✓ Created event for Today (${dateStr})`);
    } else {
        eventId = event[0].id;
        console.log(`✓ Using existing event for Today (${dateStr})`);
    }

    // 4. Test user
    const testEmail = "outlaws01+today@gmail.com";
    let testUser = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);

    let userId: string;
    if (testUser.length === 0) {
        userId = crypto.randomUUID();
        await db.insert(users).values({
            id: userId,
            email: testEmail,
            name: "Test Same-Day User",
        });
        console.log(`✓ Created test user: ${testEmail}`);
    } else {
        userId = testUser[0].id;
        console.log(`✓ Using existing test user: ${testEmail}`);
    }

    // 5. Create booking
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
        console.log("✓ Created booking for same-day test");
    }

    console.log("\n--- TEST READY ---");
    console.log("To trigger: curl -X GET http://localhost:3000/api/send-reminders");
    process.exit(0);
}

testTodayReminder().catch((err: any) => {
    console.error(err);
    process.exit(1);
});
