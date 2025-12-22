#!/usr/bin/env tsx
/**
 * Script to run migration 007: Add google_maps_link column to coffee_shops table
 * 
 * Usage: tsx scripts/run-migration-007.ts
 */

import { config } from "dotenv";
import { sql } from "@vercel/postgres";

// Load environment variables from .env.local or .env
config({ path: ".env.local" });
config({ path: ".env" });

async function runMigration() {
    console.log("🚀 Running migration 007: Add google_maps_link column...");
    
    if (!process.env.POSTGRES_URL) {
        console.error("❌ Error: POSTGRES_URL environment variable is not set.");
        console.error("Please make sure you have a .env.local or .env file with POSTGRES_URL set.");
        process.exit(1);
    }
    
    try {
        await sql`
            ALTER TABLE coffee_shops 
            ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
        `;
        console.log("✅ Migration 007 completed successfully!");
    } catch (error: any) {
        // Check if error is because column already exists
        if (error?.message?.includes("already exists") || error?.message?.includes("duplicate column")) {
            console.log("ℹ️  Column google_maps_link already exists. Migration may have already been run.");
            console.log("✅ Migration check completed.");
        } else {
            console.error("❌ Migration failed:", error);
            process.exit(1);
        }
    }
}

runMigration();
