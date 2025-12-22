#!/usr/bin/env tsx

/**
 * Script to initialize the development database with all required tables
 * 
 * Usage: npx tsx scripts/init-dev-db.ts
 * 
 * This script creates all tables needed for the application in the dev database.
 * It uses POSTGRES_URL_DEV from .env.local
 */

import { config } from "dotenv";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
config({ path: ".env.local" });
config({ path: ".env" });

async function initDatabase() {
    console.log("🚀 Initializing development database...\n");
    
    // Use POSTGRES_URL_DEV for local dev, POSTGRES_URL for production
    const connectionString = process.env.POSTGRES_URL_DEV || process.env.POSTGRES_URL;
    
    if (!connectionString) {
        console.error("❌ Error: Database connection string not found.");
        console.error("Please set POSTGRES_URL_DEV in your .env.local file.");
        process.exit(1);
    }
    
    if (process.env.POSTGRES_URL_DEV) {
        console.log("🔧 Using development database (POSTGRES_URL_DEV)");
    } else {
        console.log("⚠️  WARNING: Using POSTGRES_URL - make sure this is the correct database!");
        console.log("   For dev database, set POSTGRES_URL_DEV in .env.local\n");
    }
    
    const pool = new Pool({
        connectionString,
    });
    
    try {
        // Read the base migration file
        const baseMigrationPath = path.join(process.cwd(), "migrations", "0000_dizzy_stone_men.sql");
        let baseMigration = "";
        
        if (fs.existsSync(baseMigrationPath)) {
            baseMigration = fs.readFileSync(baseMigrationPath, "utf-8");
            console.log("📄 Found base migration file\n");
        } else {
            console.log("⚠️  Base migration file not found, creating tables from schema...\n");
        }
        
        // Create tables from base migration if available
        if (baseMigration) {
            // Split by statement-breakpoint and execute each statement
            const statements = baseMigration
                .split("--> statement-breakpoint")
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith("--"));
            
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await pool.query(statement);
                    } catch (error: any) {
                        // Ignore errors for tables/columns that already exist
                        if (error?.message?.includes("already exists") || 
                            error?.message?.includes("duplicate") ||
                            error?.code === "42P07" || // table already exists
                            error?.code === "42701") { // column already exists
                            // Continue silently
                        } else {
                            throw error;
                        }
                    }
                }
            }
            console.log("✅ Base tables created\n");
        } else {
            // Create tables manually from schema
            console.log("📝 Creating tables from schema definition...\n");
            
            // Create users table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    email TEXT NOT NULL UNIQUE,
                    "emailVerified" TIMESTAMP,
                    image TEXT,
                    bio TEXT,
                    country TEXT,
                    language_preference TEXT DEFAULT 'en',
                    role TEXT DEFAULT 'user',
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `).catch(() => {}); // Ignore if exists
            
            // Create account table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS account (
                    "userId" TEXT NOT NULL,
                    type TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    "providerAccountId" TEXT NOT NULL,
                    refresh_token TEXT,
                    access_token TEXT,
                    expires_at INTEGER,
                    token_type TEXT,
                    scope TEXT,
                    id_token TEXT,
                    session_state TEXT,
                    PRIMARY KEY (provider, "providerAccountId")
                );
            `).catch(() => {});
            
            // Create session table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS session (
                    "sessionToken" TEXT PRIMARY KEY NOT NULL,
                    "userId" TEXT NOT NULL,
                    expires TIMESTAMP NOT NULL
                );
            `).catch(() => {});
            
            // Create verificationToken table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS "verificationToken" (
                    identifier TEXT NOT NULL,
                    token TEXT NOT NULL,
                    expires TIMESTAMP NOT NULL,
                    PRIMARY KEY (identifier, token)
                );
            `).catch(() => {});
            
            // Create coffee_shops table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS coffee_shops (
                    id TEXT PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    location TEXT NOT NULL,
                    city TEXT NOT NULL DEFAULT 'Taipei',
                    description TEXT NOT NULL,
                    image TEXT NOT NULL,
                    rating INTEGER NOT NULL,
                    features TEXT NOT NULL
                );
            `).catch(() => {});
            
            // Create meetups table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS meetups (
                    id TEXT PRIMARY KEY NOT NULL,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    location_id TEXT,
                    status TEXT NOT NULL DEFAULT 'open',
                    language TEXT NOT NULL DEFAULT 'en'
                );
            `).catch(() => {});
            
            // Create bookings table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS bookings (
                    id TEXT PRIMARY KEY NOT NULL,
                    user_id TEXT NOT NULL,
                    meetup_id TEXT NOT NULL,
                    vibe TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'confirmed',
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `).catch(() => {});
            
            // Create feedback table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS feedback (
                    id TEXT PRIMARY KEY NOT NULL,
                    booking_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    rating INTEGER NOT NULL,
                    comment TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `).catch(() => {});
            
            // Add foreign key constraints
            await pool.query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'account_userId_users_id_fk'
                    ) THEN
                        ALTER TABLE account 
                        ADD CONSTRAINT account_userId_users_id_fk 
                        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
                    END IF;
                END $$;
            `).catch(() => {});
            
            await pool.query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'session_userId_users_id_fk'
                    ) THEN
                        ALTER TABLE session 
                        ADD CONSTRAINT session_userId_users_id_fk 
                        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
                    END IF;
                END $$;
            `).catch(() => {});
            
            await pool.query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'bookings_user_id_users_id_fk'
                    ) THEN
                        ALTER TABLE bookings 
                        ADD CONSTRAINT bookings_user_id_users_id_fk 
                        FOREIGN KEY (user_id) REFERENCES users(id);
                    END IF;
                END $$;
            `).catch(() => {});
            
            await pool.query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'bookings_meetup_id_meetups_id_fk'
                    ) THEN
                        ALTER TABLE bookings 
                        ADD CONSTRAINT bookings_meetup_id_meetups_id_fk 
                        FOREIGN KEY (meetup_id) REFERENCES meetups(id);
                    END IF;
                END $$;
            `).catch(() => {});
            
            await pool.query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'meetups_location_id_coffee_shops_id_fk'
                    ) THEN
                        ALTER TABLE meetups 
                        ADD CONSTRAINT meetups_location_id_coffee_shops_id_fk 
                        FOREIGN KEY (location_id) REFERENCES coffee_shops(id);
                    END IF;
                END $$;
            `).catch(() => {});
            
            await pool.query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'feedback_booking_id_bookings_id_fk'
                    ) THEN
                        ALTER TABLE feedback 
                        ADD CONSTRAINT feedback_booking_id_bookings_id_fk 
                        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
                    END IF;
                END $$;
            `).catch(() => {});
            
            await pool.query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'feedback_user_id_users_id_fk'
                    ) THEN
                        ALTER TABLE feedback 
                        ADD CONSTRAINT feedback_user_id_users_id_fk 
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
                    END IF;
                END $$;
            `).catch(() => {});
            
            console.log("✅ Base tables created\n");
        }
        
        // Add additional columns that might be missing
        console.log("📝 Adding additional columns...\n");
        
        // Add has_plus_one to bookings if it doesn't exist
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'bookings' AND column_name = 'has_plus_one'
                ) THEN
                    ALTER TABLE bookings ADD COLUMN has_plus_one TEXT DEFAULT 'false';
                END IF;
            END $$;
        `).catch(() => {});
        
        // Add google_maps_link to coffee_shops if it doesn't exist
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'coffee_shops' AND column_name = 'google_maps_link'
                ) THEN
                    ALTER TABLE coffee_shops ADD COLUMN google_maps_link TEXT;
                END IF;
            END $$;
        `).catch(() => {});
        
        // Add country to users if it doesn't exist
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'country'
                ) THEN
                    ALTER TABLE users ADD COLUMN country TEXT;
                END IF;
            END $$;
        `).catch(() => {});
        
        console.log("✅ Additional columns added\n");
        
        // Verify tables exist
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        
        console.log("📊 Database tables:");
        tablesResult.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });
        
        console.log("\n✅ Development database initialized successfully!");
        console.log("\n💡 Next steps:");
        console.log("   1. Run migrations: npm run migrate:google-maps");
        console.log("   2. Seed data (optional): Check scripts/seed.ts");
        console.log("   3. Start dev server: npm run dev");
        
    } catch (error: any) {
        console.error("❌ Initialization failed:", error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initDatabase();
