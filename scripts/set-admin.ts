import { config } from "dotenv";
config({ path: ".env.local" });

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

    const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
    const db = drizzle(pool);

    await db.update(users)
        .set({ role: "admin" })
        .where(eq(users.email, email));

    console.log(`✅ Admin role set for ${email}!`);
    await pool.end();
}

setAdmin().catch((err) => {
    console.error("❌ Failed:", err);
    process.exit(1);
});
