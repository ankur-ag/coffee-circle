import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { meetups, coffeeShops } from "../lib/schema";
import * as schema from "../lib/schema";

async function addWeekendEvents() {
    console.log("Adding weekend events...");

    const db = drizzle(sql, { schema });

    // Get available coffee shops
    const locations = await db.select().from(coffeeShops);
    
    if (locations.length === 0) {
        console.error("No coffee shops found. Please seed coffee shops first.");
        process.exit(1);
    }

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
    
    const nextSunday = new Date(nextSaturday);
    nextSunday.setDate(nextSaturday.getDate() + 1);
    nextSunday.setHours(0, 0, 0, 0);

    // Format dates as YYYY-MM-DD
    const saturdayDate = nextSaturday.toISOString().split("T")[0];
    const sundayDate = nextSunday.toISOString().split("T")[0];

    console.log(`Next Saturday: ${saturdayDate}`);
    console.log(`Next Sunday: ${sundayDate}`);

    // Check if events already exist for these dates
    const existingEvents = await db.select().from(meetups);
    const existingDates = existingEvents.map(e => e.date);
    
    const events = [
        {
            id: crypto.randomUUID(),
            date: saturdayDate,
            time: "14:00",
            locationId: locations[0].id, // Use first location
            status: "open",
            language: "en",
        },
        {
            id: crypto.randomUUID(),
            date: sundayDate,
            time: "14:00",
            locationId: locations.length > 1 ? locations[1].id : locations[0].id, // Use second location if available
            status: "open",
            language: "zh",
        },
    ];

    console.log("Inserting events...");
    for (const event of events) {
        // Check if event already exists for this date
        if (existingDates.includes(event.date)) {
            console.log(`Event for ${event.date} already exists, skipping...`);
            continue;
        }
        
        try {
            await db.insert(meetups).values(event);
            console.log(`✓ Created event for ${event.date} at ${event.time} (${event.language})`);
        } catch (error) {
            console.error(`Failed to create event for ${event.date}:`, error);
        }
    }

    console.log("Weekend events added successfully!");
    process.exit(0);
}

addWeekendEvents().catch((err) => {
    console.error("Failed to add weekend events:", err);
    process.exit(1);
});

