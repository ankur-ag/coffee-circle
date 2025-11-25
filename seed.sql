-- Seed Users
INSERT INTO users (id, name, email, image, bio) VALUES 
('u1', 'Sarah Chen', 'sarah.chen@example.com', '/images/avatar_sarah_1763804701359.png', 'Digital Nomad & Designer'),
('u2', 'David Lin', 'david.lin@example.com', '/images/avatar_david_1763804717491.png', 'Software Engineer'),
('u3', 'Emily Wang', 'emily.wang@example.com', '/images/avatar_sarah_1763804701359.png', 'Marketing Specialist'),
('u4', 'Michael Chang', 'michael.chang@example.com', '/images/avatar_david_1763804717491.png', 'Architect');

-- Seed Coffee Shops
INSERT INTO coffee_shops (id, name, location, description, image, rating, features) VALUES 
('1', 'Simple Kaffa', 'Zhongzheng District, Taipei', 'World-renowned coffee shop known for its championship-winning baristas and minimalist industrial design.', '/images/coffee_shop_modern_1763804664351.png', 49, '["Specialty Coffee","Quiet","WiFi"]'),
('2', 'Fika Fika Cafe', 'Zhongshan District, Taipei', 'Nordic-style cafe offering a cozy atmosphere and exceptional single-origin beans.', '/images/coffee_shop_cozy_1763804682580.png', 48, '["Cozy","Pastries","Bright"]'),
('3', 'The Lobby of Simple Kaffa', 'Songshan District, Taipei', 'A spacious venue perfect for group conversations with a view of the city.', '/images/coffee_shop_modern_1763804664351.png', 47, '[" spacious","City View","Groups"]');

-- Seed Meetups (Dates need to be dynamic in real app, but hardcoding for MVP seed is fine, or use SQLite date functions)
-- Using fixed dates for now to match the "next weekend" logic roughly, or just future dates
-- Saturday events are in Chinese (zh), Sunday events are in English (en)
INSERT INTO meetups (id, date, time, status, language) VALUES 
('m1', date('now', 'weekday 6'), '14:00', 'open', 'zh'), -- Next Saturday - Chinese
('m2', date('now', 'weekday 0', '+7 days'), '14:00', 'open', 'en'); -- Next Sunday - English
