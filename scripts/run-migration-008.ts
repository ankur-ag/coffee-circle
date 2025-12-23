#!/usr/bin/env tsx
/**
 * Script to run migration 008: Add capacity column to meetups table
 * 
 * Usage: tsx scripts/run-migration-008.ts
 * 
 * This script uses POSTGRES_URL_DEV for local dev, or POSTGRES_URL as fallback
 */

import { config } from "dotenv";
import { Pool } from "pg";

// Load environment variables from .env.local or .env
config({ path: ".env.local" });
config({ path: ".env" });

async function runMigration() {
    console.log("🚀 Running migration 008: Add capacity column to meetups table...");
    
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
        // Check if column already exists
        const checkResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'meetups' AND column_name = 'capacity';
        `);
        
        if (checkResult.rows.length > 0) {
            console.log("ℹ️  Column capacity already exists. Migration may have already been run.");
            console.log("✅ Migration check completed.");
        } else {
            // Add the capacity column with default value of 6
            await pool.query(`
                ALTER TABLE meetups 
                ADD COLUMN capacity INTEGER NOT NULL DEFAULT 6;
            `);
            console.log("✅ Migration 008 completed successfully!");
            console.log("   Added capacity column with default value of 6 to meetups table.");
        }
    } catch (error: any) {
        // Check if error is because column already exists
        if (error?.message?.includes("already exists") || error?.message?.includes("duplicate column")) {
            console.log("ℹ️  Column capacity already exists. Migration may have already been run.");
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
