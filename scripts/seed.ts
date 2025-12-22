import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { coffeeShops, meetups, users } from "../lib/schema";
import { eq } from "drizzle-orm";

async function seed() {
    console.log("🌱 Seeding development database...\n");

    // Use POSTGRES_URL_DEV for local dev, POSTGRES_URL for production
    const connectionString = process.env.POSTGRES_URL_DEV || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error("❌ Error: Database connection string not found.");
        console.error("Please set POSTGRES_URL_DEV in .env.local for development");
        console.error("or POSTGRES_URL for production.");
        process.exit(1);
    }

    if (process.env.POSTGRES_URL_DEV) {
        console.log("🔧 Using development database (POSTGRES_URL_DEV)\n");
    } else {
        console.log("⚠️  WARNING: Using POSTGRES_URL - make sure this is the correct database!\n");
    }

    const pool = new Pool({ connectionString });
    const db = drizzle(pool);

    try {
        // Coffee Shops / Locations
        const shops = [
            {
                id: crypto.randomUUID(),
                name: "Simple Kaffa",
                location: "Zhongxiao East Road, Section 4",
                city: "Taipei",
                description: "World champion barista's flagship store. Famous for their geisha coffee and matcha roll. A must-visit for coffee enthusiasts.",
                image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop",
                rating: 48, // 4.8
                features: JSON.stringify(["wifi", "power", "specialty", "quiet"]),
                googleMapsLink: "https://maps.google.com/?q=Simple+Kaffa+Taipei",
            },
            {
                id: crypto.randomUUID(),
                name: "Fika Fika Cafe",
                location: "Yitong Park, Zhongshan District",
                city: "Taipei",
                description: "Nordic style roastery with a bright, airy atmosphere. Great for working and enjoying specialty coffee.",
                image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop",
                rating: 47, // 4.7
                features: JSON.stringify(["wifi", "power", "outdoor", "pastries"]),
                googleMapsLink: "https://maps.google.com/?q=Fika+Fika+Cafe+Taipei",
            },
            {
                id: crypto.randomUUID(),
                name: "The Normal",
                location: "Ren'ai Road, Section 3",
                city: "Taipei",
                description: "Sleek, modern espresso bar focusing on single origin beans. Perfect for a quick coffee break.",
                image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1000&auto=format&fit=crop",
                rating: 46, // 4.6
                features: JSON.stringify(["wifi", "quiet", "specialty"]),
                googleMapsLink: "https://maps.google.com/?q=The+Normal+Cafe+Taipei",
            },
            {
                id: crypto.randomUUID(),
                name: "Rufous Coffee",
                location: "Fuxing South Road",
                city: "Taipei",
                description: "Cozy neighborhood cafe known for excellent pour-over coffee and friendly atmosphere.",
                image: "https://images.unsplash.com/photo-1511920170033-83939d3810c5?q=80&w=1000&auto=format&fit=crop",
                rating: 45, // 4.5
                features: JSON.stringify(["wifi", "cozy", "specialty"]),
                googleMapsLink: "https://maps.google.com/?q=Rufous+Coffee+Taipei",
            },
            {
                id: crypto.randomUUID(),
                name: "Coffee Lover's Planet",
                location: "Xinyi District",
                city: "Taipei",
                description: "Spacious cafe with multiple brewing methods. Great for groups and coffee education.",
                image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1000&auto=format&fit=crop",
                rating: 44, // 4.4
                features: JSON.stringify(["wifi", "power", "spacious", "groups"]),
                googleMapsLink: "https://maps.google.com/?q=Coffee+Lovers+Planet+Taipei",
            },
        ];

        console.log("📍 Inserting coffee shops...");
        for (const shop of shops) {
            try {
                await db.insert(coffeeShops).values(shop).onConflictDoNothing();
                console.log(`   ✓ ${shop.name}`);
            } catch (error: any) {
                if (error?.code !== "23505") { // Ignore unique constraint errors
                    console.log(`   ⚠️  ${shop.name} (may already exist)`);
                }
            }
        }

        // Users
        const userData = [
            {
                id: crypto.randomUUID(),
                name: "Sarah Chen",
                email: "sarah.chen@example.com",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
                bio: "Digital Nomad & Designer. Love exploring new cafes and meeting creative people.",
                country: "Taiwan",
                languagePreference: "en",
                role: "user",
            },
            {
                id: crypto.randomUUID(),
                name: "David Lin",
                email: "david.lin@example.com",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
                bio: "Software Engineer. Coffee enthusiast and always up for a good conversation.",
                country: "Taiwan",
                languagePreference: "en",
                role: "user",
            },
            {
                id: crypto.randomUUID(),
                name: "Emily Wang",
                email: "emily.wang@example.com",
                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
                bio: "Marketing Specialist. Love networking and discovering hidden gem cafes.",
                country: "Taiwan",
                languagePreference: "zh",
                role: "user",
            },
            {
                id: crypto.randomUUID(),
                name: "Michael Chang",
                email: "michael.chang@example.com",
                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
                bio: "Architect. Passionate about design, coffee, and meaningful conversations.",
                country: "Taiwan",
                languagePreference: "zh",
                role: "user",
            },
            {
                id: crypto.randomUUID(),
                name: "Jessica Liu",
                email: "jessica.liu@example.com",
                image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
                bio: "Product Manager. Always looking to connect with interesting people over coffee.",
                country: "Taiwan",
                languagePreference: "en",
                role: "user",
            },
            {
                id: crypto.randomUUID(),
                name: "Alex Chen",
                email: "alex.chen@example.com",
                image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
                bio: "Entrepreneur. Building startups and love discussing ideas over great coffee.",
                country: "Taiwan",
                languagePreference: "en",
                role: "user",
            },
        ];

        console.log("\n👥 Inserting users...");
        for (const user of userData) {
            try {
                await db.insert(users).values(user).onConflictDoNothing();
                console.log(`   ✓ ${user.name} (${user.email})`);
            } catch (error: any) {
                if (error?.code !== "23505") { // Ignore unique constraint errors
                    console.log(`   ⚠️  ${user.name} (may already exist)`);
                }
            }
        }

        // Meetups (optional - create some upcoming events)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekend = new Date(today);
        // Get next Saturday
        const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
        nextWeekend.setDate(today.getDate() + daysUntilSaturday);

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
                date: nextWeekend.toISOString().split("T")[0],
                time: "14:00",
                locationId: shops[1].id,
                status: "open",
                language: "en",
            },
            {
                id: crypto.randomUUID(),
                date: nextWeek.toISOString().split("T")[0],
                time: "15:00",
                locationId: shops[2].id,
                status: "open",
                language: "zh",
            },
        ];

        console.log("\n📅 Inserting meetups...");
        for (const meetup of meetupData) {
            try {
                await db.insert(meetups).values(meetup).onConflictDoNothing();
                const shop = shops.find(s => s.id === meetup.locationId);
                console.log(`   ✓ ${meetup.date} at ${meetup.time} - ${shop?.name || "Unknown"}`);
            } catch (error: any) {
                console.log(`   ⚠️  Meetup may already exist`);
            }
        }

        console.log("\n✅ Seeding complete!");
        console.log(`\n📊 Summary:`);
        console.log(`   - ${shops.length} coffee shops`);
        console.log(`   - ${userData.length} users`);
        console.log(`   - ${meetupData.length} meetups`);
        console.log(`\n💡 You can now start your dev server and test the application!`);

    } catch (error: any) {
        console.error("\n❌ Seeding failed:", error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
