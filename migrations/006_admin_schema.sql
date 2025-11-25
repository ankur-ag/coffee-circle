-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- Add city column to coffee_shops table
ALTER TABLE coffee_shops ADD COLUMN city TEXT DEFAULT 'Taipei';
