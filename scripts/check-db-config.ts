#!/usr/bin/env tsx

/**
 * Script to verify database configuration and ensure dev/prod separation
 * 
 * Usage: npx tsx scripts/check-db-config.ts
 */

import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const devDbUrl = process.env.POSTGRES_URL_DEV;
const prodDbUrl = process.env.POSTGRES_URL;

console.log("🔍 Database Configuration Check\n");
console.log("=" .repeat(50));

if (!devDbUrl && !prodDbUrl) {
    console.error("❌ ERROR: No database connection strings found!");
    console.error("   Set POSTGRES_URL_DEV in .env.local for development");
    console.error("   Set POSTGRES_URL in Vercel for production");
    process.exit(1);
}

if (devDbUrl) {
    console.log("✅ POSTGRES_URL_DEV found (for local development)");
    // Extract database name from connection string for display
    const dbNameMatch = devDbUrl.match(/\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (dbNameMatch) {
        console.log(`   Database: ${dbNameMatch[5]}`);
        console.log(`   Host: ${dbNameMatch[3]}`);
    } else {
        console.log(`   Connection string: ${devDbUrl.substring(0, 30)}...`);
    }
} else {
    console.warn("⚠️  POSTGRES_URL_DEV not set in .env.local");
    console.warn("   Local dev will use POSTGRES_URL (may be same as production!)");
}

console.log("");

if (prodDbUrl) {
    console.log("✅ POSTGRES_URL found");
    const dbNameMatch = prodDbUrl.match(/\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (dbNameMatch) {
        console.log(`   Database: ${dbNameMatch[5]}`);
        console.log(`   Host: ${dbNameMatch[3]}`);
    } else {
        console.log(`   Connection string: ${prodDbUrl.substring(0, 30)}...`);
    }
} else {
    console.warn("⚠️  POSTGRES_URL not set (will be set in Vercel for production)");
}

console.log("");

// Check if they're the same (bad!)
if (devDbUrl && prodDbUrl && devDbUrl === prodDbUrl) {
    console.error("❌ WARNING: POSTGRES_URL_DEV and POSTGRES_URL are the SAME!");
    console.error("   This means dev and prod are using the same database.");
    console.error("   Create a separate dev database and update POSTGRES_URL_DEV in .env.local");
    process.exit(1);
} else if (devDbUrl && prodDbUrl) {
    console.log("✅ POSTGRES_URL_DEV and POSTGRES_URL are different");
    console.log("   Dev and prod databases are properly separated!");
} else if (devDbUrl) {
    console.log("✅ POSTGRES_URL_DEV is set for local development");
    console.log("   Make sure POSTGRES_URL in Vercel points to a different production database");
}

console.log("\n" + "=".repeat(50));
console.log("\n📝 Next Steps:");
console.log("1. Create a separate dev database in Vercel Dashboard → Storage");
console.log("2. Set POSTGRES_URL_DEV in .env.local to your dev database");
console.log("3. Set POSTGRES_URL in Vercel Dashboard → Environment Variables (Production)");
console.log("4. Run migrations on both databases");
console.log("5. Restart your dev server after updating .env.local\n");
