#!/usr/bin/env tsx
/**
 * Script to run migration 007: Add google_maps_link column to coffee_shops table
 * 
 * Usage: tsx scripts/run-migration-007.ts
 * 
 * This script uses POSTGRES_URL_DEV for local dev, or POSTGRES_URL as fallback
 */

import { config } from "dotenv";
import { Pool } from "pg";

// Load environment variables from .env.local or .env
config({ path: ".env.local" });
config({ path: ".env" });

async function runMigration() {
    console.log("🚀 Running migration 007: Add google_maps_link column...");
    
    // Use POSTGRES_URL_DEV for local dev, POSTGRES_URL for production
    const connectionString = process.env.POSTGRES_URL_DEV || process.env.POSTGRES_URL;
    
    if (!connectionString) {
        console.error("❌ Error: Database connection string not found.");
        console.error("Please set POSTGRES_URL_DEV (for dev) or POSTGRES_URL in your .env.local file.");
        process.exit(1);
    }
    
    if (process.env.POSTGRES_URL_DEV) {
        console.log("🔧 Using development database (POSTGRES_URL_DEV)");
    } else {
        console.log("⚠️  Using POSTGRES_URL - make sure this is the correct database!");
    }
    
    const pool = new Pool({
        connectionString,
    });
    
    try {
        await pool.query(`
            ALTER TABLE coffee_shops 
            ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
        `);
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
    } finally {
        await pool.end();
    }
}

runMigration();
