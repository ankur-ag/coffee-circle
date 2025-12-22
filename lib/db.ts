import { createPool } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

/**
 * Get database connection
 * 
 * Environment variables:
 * - POSTGRES_URL_DEV: Development database connection string (for local dev)
 * - POSTGRES_URL: Production database connection string (for Vercel production)
 * 
 * To separate dev and prod databases:
 * 1. Create a separate dev database in Vercel Dashboard → Storage → Postgres
 * 2. Set POSTGRES_URL_DEV in .env.local to your dev database connection string
 * 3. Set POSTGRES_URL in Vercel Dashboard → Environment Variables (Production only) to your prod database
 * 
 * How it works:
 * - Local dev: Uses POSTGRES_URL_DEV from .env.local (if set), otherwise falls back to POSTGRES_URL
 * - Production: Uses POSTGRES_URL from Vercel environment variables
 * 
 * This works for both Edge Runtime and Server Actions.
 */
export function getDb() {
    // For local development, prefer POSTGRES_URL_DEV to ensure separate databases
    // In production, POSTGRES_URL_DEV won't be set, so it uses POSTGRES_URL from Vercel
    const connectionString = process.env.POSTGRES_URL_DEV || process.env.POSTGRES_URL;
    
    if (!connectionString) {
        throw new Error(
            "Database connection string not found. " +
            "Set POSTGRES_URL_DEV in .env.local for development, " +
            "or POSTGRES_URL in Vercel environment variables for production."
        );
    }
    
    // Create pool with explicit connection string to ensure dev/prod separation
    // createPool works with connection strings and is Edge Runtime compatible
    const pool = createPool({
        connectionString,
    });
    
    return drizzle(pool, { schema });
}
