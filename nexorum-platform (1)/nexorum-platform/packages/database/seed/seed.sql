-- =====================================================
-- NEXORUM SEED DATA
-- =====================================================

-- Insert markets
INSERT INTO markets (name, type, trading_fee_percent) VALUES
    ('Global Exchange', 'global', 1.5),
    ('Hunt Arena', 'hunt', 2.5),
    ('Racing Circuit', 'racing', 2.0),
    ('Fishing Waters', 'fishing', 2.5),
    ('Farm Valley', 'farm', 1.5),
    ('Survival Zone', 'survival', 3.0);

-- Insert items
INSERT INTO items (name, description, category, rarity, market_type, base_price, max_supply, is_tradable) VALUES
    -- Global items
    ('NEXO Crystal', 'Pure crystallized NEXO energy', 'token', 'legendary', 'global', 1000.00, 10000, true),
    ('Genesis Badge', 'Awarded to founding members', 'material', 'mythic', 'global', 5000.00, 1000, true),
    -- Hunt items
    ('Shadow Bow', 'Silent hunter weapon', 'weapon', 'epic', 'hunt', 250.00, 500, true),
    ('Camo Cloak', 'Blend into surroundings', 'armor', 'rare', 'hunt', 120.00, 1000, true),
    ('Hunter Trap', 'Advanced trapping device', 'tool', 'uncommon', 'hunt', 45.00, 5000, true),
    -- Racing items
    ('Turbo Engine', 'High-performance engine', 'vehicle', 'epic', 'racing', 300.00, 800, true),
    ('Nitro Boost', 'Temporary speed boost', 'consumable', 'uncommon', 'racing', 15.00, 10000, true),
    ('Racing Suit', 'Aerodynamic racing gear', 'armor', 'rare', 'racing', 150.00, 1500, true),
    -- Fishing items
    ('Mythic Rod', 'Legendary fishing rod', 'tool', 'legendary', 'fishing', 500.00, 200, true),
    ('Golden Bait', 'Attracts rare fish', 'bait', 'rare', 'fishing', 25.00, 5000, true),
    ('Aqua Armor', 'Underwater protection', 'armor', 'epic', 'fishing', 200.00, 600, true),
    -- Farm items
    ('Golden Seeds', 'Produce premium crops', 'material', 'epic', 'farm', 75.00, 3000, true),
    ('Auto Harvester', 'Automated farming tool', 'tool', 'rare', 'farm', 180.00, 1000, true),
    ('Fertilizer X', 'Extreme growth formula', 'consumable', 'uncommon', 'farm', 20.00, 10000, true),
    -- Survival items
    ('Survival Knife', 'Multi-purpose blade', 'weapon', 'common', 'survival', 30.00, 10000, true),
    ('Medkit Pro', 'Advanced medical supplies', 'consumable', 'rare', 'survival', 50.00, 5000, true),
    ('Base Shield', 'Protect your territory', 'armor', 'epic', 'survival', 280.00, 800, true),
    ('Flare Gun', 'Signal for help', 'tool', 'uncommon', 'survival', 35.00, 5000, true);

-- Insert skins
INSERT INTO skins (name, theme, rarity, applicable_to) VALUES
    ('Neon Cyber', 'cyberpunk', 'epic', ARRAY['weapon', 'armor']),
    ('Golden Dragon', 'oriental', 'legendary', ARRAY['weapon', 'armor', 'vehicle']),
    ('Arctic Frost', 'winter', 'rare', ARRAY['armor', 'tool']),
    ('Volcanic Ash', 'fire', 'epic', ARRAY['weapon', 'vehicle']),
    ('Forest Spirit', 'nature', 'uncommon', ARRAY['armor', 'tool']),
    ('Void Walker', 'dark', 'mythic', ARRAY['weapon', 'armor', 'vehicle', 'tool']);

-- Insert default achievements
INSERT INTO achievements (user_id, achievement_key, name, description, category, rarity, target, reward_nexo)
SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID as user_id,
    'first_login',
    'First Steps',
    'Log into NEXORUM for the first time',
    'milestone',
    'common',
    1,
    10.00
WHERE NOT EXISTS (SELECT 1 FROM achievements WHERE achievement_key = 'first_login');
