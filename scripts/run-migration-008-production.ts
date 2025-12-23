#!/usr/bin/env tsx
/**
 * Script to run migration 008 on PRODUCTION database: Add capacity column to meetups table
 * 
 * ⚠️  WARNING: This script modifies the PRODUCTION database!
 * 
 * Usage: 
 *   npm run migrate:capacity:production
 *   or
 *   tsx scripts/run-migration-008-production.ts
 * 
 * Prerequisites:
 *   - POSTGRES_URL environment variable must be set (production database)
 *   - POSTGRES_URL_DEV should NOT be set (to avoid confusion)
 *   - You must confirm before the migration runs
 */

import { config } from "dotenv";
import { Pool } from "pg";
import * as readline from "readline";

// Load environment variables from .env.local or .env
config({ path: ".env.local" });
config({ path: ".env" });

// Create readline interface for user confirmation
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

async function runProductionMigration() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║  PRODUCTION DATABASE MIGRATION - ADD CAPACITY COLUMN       ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("");
    
    // Always use POSTGRES_URL for production (ignore POSTGRES_URL_DEV)
    // Warn if POSTGRES_URL_DEV is set to avoid confusion
    if (process.env.POSTGRES_URL_DEV) {
        console.log("ℹ️  Note: POSTGRES_URL_DEV is set, but this script will use POSTGRES_URL (production).");
        console.log("");
    }
    
    // Get production connection string (always use POSTGRES_URL for production script)
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
        console.error("❌ ERROR: POSTGRES_URL environment variable not found!");
        console.error("   Please set POSTGRES_URL in your environment or .env file.");
        console.error("   You can get it from: Vercel Dashboard → Settings → Environment Variables");
        console.error("");
        process.exit(1);
    }
    
    // Extract database name from connection string for display (safety)
    let dbName = "unknown";
    try {
        const url = new URL(connectionString);
        dbName = url.pathname.replace("/", "") || "unknown";
    } catch {
        // If URL parsing fails, try to extract from connection string
        const match = connectionString.match(/\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
        if (match) {
            dbName = match[4];
        }
    }
    
    console.log("📋 Migration Details:");
    console.log(`   Database: ${dbName}`);
    console.log(`   Table: meetups`);
    console.log(`   Action: Add 'capacity' column (INTEGER, default: 6)`);
    console.log("");
    console.log("⚠️  WARNING: This will modify your PRODUCTION database!");
    console.log("");
    
    // Ask for confirmation
    const answer = await question("Type 'yes' to confirm and proceed: ");
    
    if (answer.toLowerCase() !== "yes") {
        console.log("");
        console.log("❌ Migration cancelled by user.");
        rl.close();
        process.exit(0);
    }
    
    console.log("");
    console.log("🚀 Starting migration...");
    console.log("");
    
    const pool = new Pool({
        connectionString,
    });
    
    try {
        // Test connection first
        await pool.query("SELECT 1");
        console.log("✅ Database connection successful");
        
        // Check if column already exists
        console.log("🔍 Checking if 'capacity' column already exists...");
        const checkResult = await pool.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'meetups' AND column_name = 'capacity';
        `);
        
        if (checkResult.rows.length > 0) {
            console.log("ℹ️  Column 'capacity' already exists!");
            console.log(`   Type: ${checkResult.rows[0].data_type}`);
            console.log(`   Default: ${checkResult.rows[0].column_default || 'none'}`);
            console.log("");
            console.log("✅ Migration check completed - no changes needed.");
        } else {
            console.log("   Column does not exist. Proceeding with migration...");
            console.log("");
            
            // Add the capacity column with default value of 6
            await pool.query(`
                ALTER TABLE meetups 
                ADD COLUMN capacity INTEGER NOT NULL DEFAULT 6;
            `);
            
            console.log("✅ Migration completed successfully!");
            console.log("   ✓ Added 'capacity' column to 'meetups' table");
            console.log("   ✓ Set default value to 6");
            console.log("   ✓ All existing events now have capacity = 6");
            console.log("");
            
            // Verify the change
            console.log("🔍 Verifying migration...");
            const verifyResult = await pool.query(`
                SELECT column_name, data_type, column_default
                FROM information_schema.columns 
                WHERE table_name = 'meetups' AND column_name = 'capacity';
            `);
            
            if (verifyResult.rows.length > 0) {
                console.log("✅ Verification successful!");
                console.log(`   Column: ${verifyResult.rows[0].column_name}`);
                console.log(`   Type: ${verifyResult.rows[0].data_type}`);
                console.log(`   Default: ${verifyResult.rows[0].column_default}`);
            }
        }
        
        console.log("");
        console.log("╔════════════════════════════════════════════════════════════╗");
        console.log("║                    MIGRATION COMPLETE                     ║");
        console.log("╚════════════════════════════════════════════════════════════╝");
        
    } catch (error: any) {
        console.error("");
        console.error("❌ Migration failed!");
        console.error("");
        console.error("Error details:", error.message);
        
        // Check if error is because column already exists
        if (error?.message?.includes("already exists") || error?.message?.includes("duplicate column")) {
            console.error("");
            console.error("ℹ️  Note: Column may already exist. Migration may have already been run.");
        } else {
            console.error("");
            console.error("Please check the error above and try again.");
        }
        
        rl.close();
        process.exit(1);
    } finally {
        await pool.end();
        rl.close();
    }
}

// Run the migration
runProductionMigration().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
});
