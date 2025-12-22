# Setting Up Separate Dev and Prod Databases

## Overview

This project uses separate databases for development and production to prevent test data from appearing in production.

## Setup Steps

### 1. Create a Development Database

**Option A: Create a new Vercel Postgres database (Recommended)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Create Database → Postgres
3. Name it something like `coffee-circle-dev`
4. Copy the connection string

**Option B: Use a local PostgreSQL instance**
- Install PostgreSQL locally
- Create a new database: `createdb coffee_circle_dev`
- Use connection string: `postgresql://user:password@localhost:5432/coffee_circle_dev`

### 2. Configure Local Development

Create or update `.env.local` in your project root:

```bash
# Development Database (separate from production)
# Use POSTGRES_URL_DEV to explicitly separate dev from prod
POSTGRES_URL_DEV=your_dev_database_connection_string_here

# Other environment variables
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
AUTH_SECRET=your-auth-secret
```

**Important:** Set `POSTGRES_URL_DEV` in `.env.local` to point to your **development** database. This ensures your local dev environment uses a different database than production.

### 3. Configure Production Database

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `POSTGRES_URL` with your **production** database connection string
3. Make sure it's set for **Production** environment only (not Development/Preview)

### 4. Initialize Dev Database

After setting up your dev database, initialize it with all required tables:

```bash
# Make sure POSTGRES_URL_DEV is set in .env.local to your dev database
npm run init-dev-db
```

This will create all necessary tables in your dev database.

### 5. Run Additional Migrations (if needed)

If there are any additional migrations after initialization:

```bash
npm run migrate:google-maps
```

**Important:** Run initialization and migrations on both databases:
- Dev database: Run locally with `POSTGRES_URL_DEV` in `.env.local`
- Prod database: Run via Vercel or manually with production connection string

## How It Works

- **Local Development (`npm run dev`):**
  - Uses `POSTGRES_URL_DEV` from `.env.local` → Points to dev database
  - Falls back to `POSTGRES_URL` if `POSTGRES_URL_DEV` is not set
  - Environment variables in `.env.local` override Vercel's env vars locally

- **Production (Vercel):**
  - Uses `POSTGRES_URL` from Vercel environment variables → Points to production database
  - `POSTGRES_URL_DEV` is not set in production, so it uses `POSTGRES_URL`
  - Vercel environment variables take precedence in production

## Verification

To verify you're using separate databases:

1. **Check local dev:**
   ```bash
   # In your terminal, check which database you're connected to
   cat .env.local | grep POSTGRES_URL
   ```

2. **Check production:**
   - Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify `POSTGRES_URL` points to a different database than your dev one

3. **Test it:**
   - Create a test event in local dev
   - Check production - it should NOT appear
   - Create an event in production
   - Check local dev - it should NOT appear

## Troubleshooting

### Still seeing test data in production?

1. Verify `POSTGRES_URL_DEV` in `.env.local` points to your dev database (different from prod)
2. Verify `POSTGRES_URL` in Vercel points to your production database (different from dev)
3. Restart your dev server after changing `.env.local`
4. Make sure Vercel env var is set for **Production** environment only
5. Check that the connection strings are actually different (not the same database)

### Migration errors

Make sure to run migrations on both databases:
- Dev database: Run locally with `POSTGRES_URL` in `.env.local` pointing to dev database
- Prod database: Run via Vercel or manually with production connection string

