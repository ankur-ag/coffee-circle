import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { coffeeShops, meetups } from "../lib/schema";

async function seed() {
    console.log("Seeding database...");

    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
    });
    const db = drizzle(pool);

    // Coffee Shops
    const shops = [
        {
            id: crypto.randomUUID(),
            name: "Simple Kaffa",
            location: "Zhongxiao East Road",
            city: "Taipei",
            description: "World champion barista's flagship store. Famous for their geisha coffee and matcha roll.",
            image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop",
            rating: 48, // 4.8
            features: JSON.stringify(["wifi", "power", "specialty"]),
        },
        {
            id: crypto.randomUUID(),
            name: "Fika Fika Cafe",
            location: "Yitong Park",
            city: "Taipei",
            description: "Nordic style roastery with a bright, airy atmosphere. Great for working.",
            image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop",
            rating: 47, // 4.7
            features: JSON.stringify(["wifi", "power", "outdoor"]),
        },
        {
            id: crypto.randomUUID(),
            name: "The Normal",
            location: "Ren'ai Road",
            city: "Taipei",
            description: "Sleek, modern espresso bar focusing on single origin beans.",
            image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1000&auto=format&fit=crop",
            rating: 46, // 4.6
            features: JSON.stringify(["wifi", "quiet"]),
        },
    ];

    console.log("Inserting coffee shops...");
    for (const shop of shops) {
        await db.insert(coffeeShops).values(shop).onConflictDoNothing();
    }

    // Meetups
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const meetupData = [
        {
            id: crypto.randomUUID(),
            date: tomorrow.toISOString().split("T")[0],
            time: "10:00",
            locationId: shops[0].id,
            status: "open",
            language: "en",
        },
        {
            id: crypto.randomUUID(),
            date: nextWeek.toISOString().split("T")[0],
            time: "14:00",
            locationId: shops[1].id,
            status: "open",
            language: "zh",
        },
    ];

    console.log("Inserting meetups...");
    for (const meetup of meetupData) {
        await db.insert(meetups).values(meetup).onConflictDoNothing();
    }

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
