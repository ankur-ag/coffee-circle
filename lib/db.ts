import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

/**
 * Get database connection
 * 
 * Environment variables:
 * - POSTGRES_URL: Database connection string
 *   - For production: Set in Vercel Dashboard → Environment Variables (Production)
 *   - For local dev: Set in .env.local to point to your DEV database
 * 
 * To separate dev and prod databases:
 * 1. Create a separate dev database in Vercel
 * 2. Set POSTGRES_URL in .env.local to your dev database connection string
 * 3. Set POSTGRES_URL in Vercel Dashboard (Production environment) to your prod database
 * 
 * This works for both Edge Runtime and Server Actions since @vercel/postgres
 * automatically reads POSTGRES_URL from environment variables.
 */
export function getDb() {
    return drizzle(sql, { schema });
}
