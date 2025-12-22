import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { meetups, coffeeShops, bookings, users } from "../lib/schema";
import { eq } from "drizzle-orm";
import * as schema from "../lib/schema";

async function addTestEvent() {
    console.log("Adding test event for next weekend...");

    const db = drizzle(sql, { schema });

    // Get available coffee shops
    const locations = await db.select().from(coffeeShops);
    
    if (locations.length === 0) {
        console.error("No coffee shops found. Please seed coffee shops first.");
        process.exit(1);
    }

    // Pick a random coffee shop
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    console.log(`Selected location: ${randomLocation.name}`);

    // Calculate next weekend dates
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate days until next Saturday
    let daysUntilSaturday = (6 - dayOfWeek) % 7;
    if (daysUntilSaturday === 0) {
        daysUntilSaturday = 7; // If today is Saturday, get next Saturday
    }
    
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    nextSaturday.setHours(0, 0, 0, 0);

    // Format date as YYYY-MM-DD
    const eventDate = nextSaturday.toISOString().split("T")[0];
    const eventTime = "14:00";

    console.log(`Event date: ${eventDate} at ${eventTime}`);

    // Check if event already exists for this date
    const existingEvents = await db.select().from(meetups);
    const existingDates = existingEvents.map(e => e.date);
    
    if (existingDates.includes(eventDate)) {
        console.log(`Event for ${eventDate} already exists, skipping creation...`);
        process.exit(0);
    }

    // Create the event
    const eventId = crypto.randomUUID();
    await db.insert(meetups).values({
        id: eventId,
        date: eventDate,
        time: eventTime,
        locationId: randomLocation.id,
        status: "open",
        language: "en",
    });
    console.log(`✓ Created event: ${eventDate} at ${eventTime}`);

    // Get or create test users
    let testUsers = await db.select().from(users).limit(2);
    
    // If we don't have enough users, create some
    if (testUsers.length < 2) {
        console.log("Creating test users...");
        const usersToCreate = 2 - testUsers.length;
        for (let i = 0; i < usersToCreate; i++) {
            const testUserId = crypto.randomUUID();
            const testEmail = `test-user-${Date.now()}-${i}@example.com`;
            await db.insert(users).values({
                id: testUserId,
                email: testEmail,
                name: `Test User ${i + 1}`,
            });
            console.log(`✓ Created test user: ${testEmail}`);
        }
        // Refresh the users list
        testUsers = await db.select().from(users).limit(2);
    }

    // Create 2 bookings for the event
    console.log("Creating bookings for test users...");
    for (let i = 0; i < Math.min(2, testUsers.length); i++) {
        const user = testUsers[i];
        const bookingId = crypto.randomUUID();
        
        // Randomly decide if this booking has a +1 (50% chance)
        const hasPlusOne = Math.random() > 0.5;
        
        await db.insert(bookings).values({
            id: bookingId,
            userId: user.id,
            meetupId: eventId,
            vibe: "social",
            status: "confirmed",
            hasPlusOne: hasPlusOne ? "true" : "false",
        });
        
        console.log(`✓ Created booking for ${user.name}${hasPlusOne ? " (with +1)" : ""}`);
    }

    // Calculate total attendees
    const allBookings = await db.select().from(bookings).where(eq(bookings.meetupId, eventId));
    const totalAttendees = allBookings.reduce((count: number, booking: any) => {
        const hasPlusOne = booking.hasPlusOne === "true";
        return count + (hasPlusOne ? 2 : 1);
    }, 0);

    console.log(`\n✓ Test event created successfully!`);
    console.log(`  Event: ${eventDate} at ${eventTime}`);
    console.log(`  Location: ${randomLocation.name}`);
    console.log(`  Total attendees: ${totalAttendees} / 6`);
    console.log(`  You can now test the booking flow!`);
    
    process.exit(0);
}

addTestEvent().catch((err) => {
    console.error("Failed to add test event:", err);
    process.exit(1);
});
