import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "../lib/schema";
import { eq } from "drizzle-orm";

async function setAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error("❌ Please provide an email address");
        console.log("Usage: npx tsx scripts/set-admin.ts YOUR_EMAIL@gmail.com");
        process.exit(1);
    }

    // Use POSTGRES_URL_DEV for local dev, POSTGRES_URL for production
    const connectionString = process.env.POSTGRES_URL_DEV || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error("❌ Error: Database connection string not found.");
        console.error("Please set POSTGRES_URL_DEV in .env.local for development");
        console.error("or POSTGRES_URL for production.");
        process.exit(1);
    }

    if (process.env.POSTGRES_URL_DEV) {
        console.log("🔧 Using development database (POSTGRES_URL_DEV)");
    } else {
        console.log("⚠️  Using POSTGRES_URL - make sure this is the correct database!");
    }

    const pool = new Pool({ connectionString });
    const db = drizzle(pool);

    try {
        const result = await db
            .update(users)
            .set({ role: "admin" })
            .where(eq(users.email, email))
            .returning();

        if (result.length === 0) {
            console.error(`❌ No user found with email: ${email}`);
            console.log("💡 Make sure you've signed in at least once so your user account exists.");
            process.exit(1);
        }

        console.log(`✅ Admin role set for ${email}!`);
        console.log(`   User ID: ${result[0].id}`);
        console.log(`   Name: ${result[0].name || "N/A"}`);
        console.log(`   Role: ${result[0].role}`);
        console.log("\n💡 You may need to sign out and sign back in for the changes to take effect.");
    } catch (error: any) {
        console.error("❌ Failed to set admin role:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setAdmin().catch((err) => {
    console.error("❌ Failed:", err);
    process.exit(1);
});
