-- Seed Coffee Shops (skip if already exists)
INSERT OR IGNORE INTO coffee_shops (id, name, location, description, image, rating, features) VALUES 
('1', 'Simple Kaffa', 'Zhongzheng District, Taipei', 'World-renowned coffee shop known for its championship-winning baristas and minimalist industrial design.', '/images/coffee_shop_modern_1763804664351.png', 49, '["Specialty Coffee","Quiet","WiFi"]'),
('2', 'Fika Fika Cafe', 'Zhongshan District, Taipei', 'Nordic-style cafe offering a cozy atmosphere and exceptional single-origin beans.', '/images/coffee_shop_cozy_1763804682580.png', 48, '["Cozy","Pastries","Bright"]'),
('3', 'The Lobby of Simple Kaffa', 'Songshan District, Taipei', 'A spacious venue perfect for group conversations with a view of the city.', '/images/coffee_shop_modern_1763804664351.png', 47, '[" spacious","City View","Groups"]');

-- Seed Meetups (skip if already exists)
-- Saturday events are in Chinese (zh), Sunday events are in English (en)
INSERT OR IGNORE INTO meetups (id, date, time, status, language) VALUES 
('m1', date('now', 'weekday 6'), '14:00', 'open', 'zh'), -- Next Saturday - Chinese
('m2', date('now', 'weekday 0', '+7 days'), '14:00', 'open', 'en'); -- Next Sunday - English
