import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { users } from "../lib/schema";
import * as schema from "../lib/schema";

async function addTestUsers() {
    console.log("Adding 5 test users...");

    const db = drizzle(sql, { schema });

    // Check existing users to avoid duplicates
    const existingUsers = await db.select().from(users);
    const existingEmails = new Set(existingUsers.map(u => u.email));

    const testUsers = [
        {
            name: "Alex Johnson",
            email: `test-alex-${Date.now()}@example.com`,
            bio: "Software Developer & Coffee Enthusiast",
        },
        {
            name: "Maria Garcia",
            email: `test-maria-${Date.now()}@example.com`,
            bio: "Designer passionate about community building",
        },
        {
            name: "James Wilson",
            email: `test-james-${Date.now()}@example.com`,
            bio: "Entrepreneur and networking enthusiast",
        },
        {
            name: "Emma Brown",
            email: `test-emma-${Date.now()}@example.com`,
            bio: "Writer and digital nomad",
        },
        {
            name: "Ryan Kim",
            email: `test-ryan-${Date.now()}@example.com`,
            bio: "Product Manager exploring Taipei",
        },
    ];

    console.log("Inserting test users...");
    let created = 0;
    for (const user of testUsers) {
        // Skip if email already exists (unlikely with timestamp, but just in case)
        if (existingEmails.has(user.email)) {
            console.log(`User with email ${user.email} already exists, skipping...`);
            continue;
        }

        try {
            await db.insert(users).values({
                id: crypto.randomUUID(),
                email: user.email,
                name: user.name,
                bio: user.bio,
                role: "user",
            });
            console.log(`✓ Created user: ${user.name} (${user.email})`);
            created++;
        } catch (error) {
            console.error(`Failed to create user ${user.name}:`, error);
        }
    }

    console.log(`\n✓ Created ${created} test users successfully!`);
    process.exit(0);
}

addTestUsers().catch((err) => {
    console.error("Failed to add test users:", err);
    process.exit(1);
});

