-- Add google_maps_link column to coffee_shops table
-- Note: PostgreSQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- If the column already exists, this will fail - that's okay, it means migration was already run
ALTER TABLE coffee_shops ADD COLUMN google_maps_link TEXT;
