# Database Configuration

## Current Issue: Dev and Prod Share Database

Your development and production environments are currently using the same database because they both use the `POSTGRES_URL` environment variable.

## Solution: Separate Databases

### Option 1: Use Environment-Specific Connection Strings (Recommended)

1. **Create a separate database for development:**
   - In Vercel Dashboard, create a new Postgres database for development
   - Or use a local PostgreSQL instance for development

2. **Update your `.env.local` file:**
   ```bash
   # Development Database
   POSTGRES_URL=your_dev_database_connection_string
   ```

3. **Set production database in Vercel:**
   - In Vercel Dashboard → Your Project → Settings → Environment Variables
   - Set `POSTGRES_URL` for Production environment only
   - This ensures production uses a different database

### Option 2: Use Different Environment Variable Names

Update `lib/db.ts` to use environment-specific variables:

```typescript
import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

export function getDb() {
    // Use POSTGRES_URL for production, POSTGRES_URL_DEV for local dev
    const connectionString = process.env.POSTGRES_URL_DEV || process.env.POSTGRES_URL;
    
    // If using @vercel/postgres, you may need to pass the connection string explicitly
    // Note: @vercel/postgres automatically uses POSTGRES_URL, so you might need to use a different approach
    return drizzle(sql, { schema });
}
```

### Option 3: Use a Database Prefix/Schema (Advanced)

If you must use the same database instance, you could:
- Use different schemas (PostgreSQL feature)
- Add an environment prefix to table names
- Use a database naming convention with environment suffix

## Recommended Approach

**Create separate Vercel Postgres databases:**
1. **Production Database:** Keep your current production database
2. **Development Database:** Create a new one in Vercel for development

Then:
- Set `POSTGRES_URL` in Vercel for **Production** environment
- Set `POSTGRES_URL` in your local `.env.local` to point to your **Development** database

This way:
- Local development → Development database
- Production deployment → Production database
- No test data leaks to production

## Quick Check

To verify which database you're connected to, check your `POSTGRES_URL`:
- Local: Check `.env.local` file
- Production: Check Vercel Dashboard → Environment Variables

If they're the same, that's why test events show up in production!
