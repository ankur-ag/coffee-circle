-- Add image column to users table (if it doesn't exist)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll handle errors gracefully

-- Create coffee_shops table if it doesn't exist
CREATE TABLE IF NOT EXISTS coffee_shops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    rating INTEGER NOT NULL,
    features TEXT NOT NULL
);

-- Create meetups table if it doesn't exist
CREATE TABLE IF NOT EXISTS meetups (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location_id TEXT REFERENCES coffee_shops(id),
    status TEXT NOT NULL DEFAULT 'open',
    language TEXT NOT NULL DEFAULT 'en'
);

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    meetup_id TEXT NOT NULL REFERENCES meetups(id),
    vibe TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
