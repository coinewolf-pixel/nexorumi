-- =====================================================
-- NEXORUM PLATFORM DATABASE SCHEMA
-- 18 Tables | RLS Enabled | Full Gaming Ecosystem
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PROFILES (Global user profile)
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT DEFAULT '',
    platform_level INTEGER DEFAULT 1,
    platform_xp INTEGER DEFAULT 0,
    reputation INTEGER DEFAULT 100,
    status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline', 'in_game')),
    country TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. WALLETS (NEXO token balances)
-- =====================================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nexo_balance DECIMAL(20, 8) DEFAULT 0,
    nexo_staked DECIMAL(20, 8) DEFAULT 0,
    nexo_earned DECIMAL(20, 8) DEFAULT 0,
    eth_address TEXT,
    sol_address TEXT,
    btc_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- 3. STAKING_POSITIONS
-- =====================================================
CREATE TABLE staking_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL,
    apy DECIMAL(5, 2) DEFAULT 12.50,
    lock_period_days INTEGER DEFAULT 30,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired')),
    rewards_earned DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ITEMS (Game items catalog)
-- =====================================================
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('weapon', 'armor', 'consumable', 'material', 'skin', 'nft', 'token', 'vehicle', 'tool', 'bait')),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine')),
    market_type TEXT NOT NULL CHECK (market_type IN ('global', 'hunt', 'racing', 'fishing', 'farm', 'survival')),
    image_url TEXT,
    metadata JSONB DEFAULT '{}',
    base_price DECIMAL(20, 8) DEFAULT 0,
    max_supply INTEGER,
    current_supply INTEGER DEFAULT 0,
    is_tradable BOOLEAN DEFAULT true,
    is_nft BOOLEAN DEFAULT false,
    nft_contract TEXT,
    nft_token_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. INVENTORY (User items)
-- =====================================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    equipped BOOLEAN DEFAULT false,
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, item_id)
);

-- =====================================================
-- 6. SKINS (Cosmetic items)
-- =====================================================
CREATE TABLE skins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    theme TEXT,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine')),
    image_url TEXT,
    animation_url TEXT,
    applicable_to TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. MARKETS (Trading markets)
-- =====================================================
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('global', 'hunt', 'racing', 'fishing', 'farm', 'survival')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'closed')),
    trading_fee_percent DECIMAL(5, 2) DEFAULT 2.50,
    min_price DECIMAL(20, 8) DEFAULT 0.00000001,
    max_price DECIMAL(20, 8) DEFAULT 100000000,
    volume_24h DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. MATCHES (Game matches)
-- =====================================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_type TEXT NOT NULL CHECK (market_type IN ('hunt', 'racing', 'fishing', 'farm', 'survival')),
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'active', 'paused', 'finished', 'cancelled')),
    mode TEXT NOT NULL,
    max_players INTEGER DEFAULT 10,
    current_players INTEGER DEFAULT 0,
    host_id UUID REFERENCES profiles(id),
    map_name TEXT,
    duration_seconds INTEGER,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    winner_id UUID REFERENCES profiles(id),
    replay_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. MATCH_PLAYERS
-- =====================================================
CREATE TABLE match_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team INTEGER DEFAULT 0,
    role TEXT,
    score INTEGER DEFAULT 0,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    placement INTEGER,
    reward_nexo DECIMAL(20, 8) DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(match_id, user_id)
);

-- =====================================================
-- 10. PARTIES
-- =====================================================
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    leader_id UUID NOT NULL REFERENCES profiles(id),
    max_members INTEGER DEFAULT 5,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'locked', 'disbanded')),
    voice_channel_id TEXT,
    target_market TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. PARTY_MEMBERS
-- =====================================================
CREATE TABLE party_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(party_id, user_id)
);

-- =====================================================
-- 12. GUILDS
-- =====================================================
CREATE TABLE guilds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    tag TEXT UNIQUE,
    description TEXT,
    emblem_url TEXT,
    leader_id UUID NOT NULL REFERENCES profiles(id),
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    max_members INTEGER DEFAULT 50,
    treasury_nexo DECIMAL(20, 8) DEFAULT 0,
    requirements JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. GUILD_MEMBERS
-- =====================================================
CREATE TABLE guild_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'elder', 'member', 'recruit')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    contribution_points INTEGER DEFAULT 0,
    UNIQUE(guild_id, user_id)
);

-- =====================================================
-- 14. TRADES (P2P trading)
-- =====================================================
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES profiles(id),
    buyer_id UUID REFERENCES profiles(id),
    item_id UUID NOT NULL REFERENCES items(id),
    quantity INTEGER DEFAULT 1,
    price_nexo DECIMAL(20, 8) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    market_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 15. TRANSACTIONS
-- =====================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'stake', 'unstake', 'reward', 'purchase', 'sale', 'fee', 'transfer', 'burn', 'mint')),
    amount DECIMAL(20, 8) NOT NULL,
    balance_after DECIMAL(20, 8),
    reference_id UUID,
    reference_type TEXT,
    metadata JSONB DEFAULT '{}',
    tx_hash TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 16. LEADERBOARD_ENTRIES
-- =====================================================
CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    market_type TEXT NOT NULL,
    season INTEGER DEFAULT 1,
    elo INTEGER DEFAULT 1000,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    total_score BIGINT DEFAULT 0,
    rank_position INTEGER,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, market_type, season)
);

-- =====================================================
-- 17. FRIENDSHIPS
-- =====================================================
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- =====================================================
-- 18. ACHIEVEMENTS
-- =====================================================
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    progress INTEGER DEFAULT 0,
    target INTEGER DEFAULT 1,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    reward_nexo DECIMAL(20, 8) DEFAULT 0,
    reward_item_id UUID REFERENCES items(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_key)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_platform_level ON profiles(platform_level DESC);
CREATE INDEX idx_profiles_reputation ON profiles(reputation DESC);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_inventory_item ON inventory(item_id);
CREATE INDEX idx_items_market ON items(market_type);
CREATE INDEX idx_items_rarity ON items(rarity);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_market ON matches(market_type);
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_user ON match_players(user_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_market ON trades(market_type);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_leaderboard_market ON leaderboard_entries(market_type, season);
CREATE INDEX idx_leaderboard_elo ON leaderboard_entries(elo DESC);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_achievements_user ON achievements(user_id);
CREATE INDEX idx_party_members_party ON party_members(party_id);
CREATE INDEX idx_guild_members_guild ON guild_members(guild_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Wallets: users can only access own
CREATE POLICY "Users can view own wallet"
    ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet"
    ON wallets FOR UPDATE USING (auth.uid() = user_id);

-- Inventory: users can view own, all can view for trading
CREATE POLICY "Users can view own inventory"
    ON inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inventory"
    ON inventory FOR ALL USING (auth.uid() = user_id);

-- Match players: viewable by match participants
CREATE POLICY "Match players viewable by participants"
    ON match_players FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM match_players mp WHERE mp.match_id = match_players.match_id AND mp.user_id = auth.uid())
    );

-- Parties: viewable by members
CREATE POLICY "Parties viewable by members"
    ON parties FOR SELECT USING (
        status != 'disbanded' AND (
            leader_id = auth.uid() OR
            EXISTS (SELECT 1 FROM party_members pm WHERE pm.party_id = parties.id AND pm.user_id = auth.uid())
        )
    );

-- Party members: viewable by party members
CREATE POLICY "Party members viewable by party"
    ON party_members FOR SELECT USING (
        EXISTS (SELECT 1 FROM party_members pm WHERE pm.party_id = party_members.party_id AND pm.user_id = auth.uid())
    );

-- Guilds: viewable by all, editable by leader/officers
CREATE POLICY "Guilds viewable by all"
    ON guilds FOR SELECT USING (true);
CREATE POLICY "Guild leader can update"
    ON guilds FOR UPDATE USING (auth.uid() = leader_id);

-- Guild members: viewable by guild members
CREATE POLICY "Guild members viewable by guild"
    ON guild_members FOR SELECT USING (
        EXISTS (SELECT 1 FROM guild_members gm WHERE gm.guild_id = guild_members.guild_id AND gm.user_id = auth.uid())
    );

-- Trades: viewable by all active
CREATE POLICY "Active trades viewable by all"
    ON trades FOR SELECT USING (status = 'active' OR seller_id = auth.uid() OR buyer_id = auth.uid());
CREATE POLICY "Users can create trades"
    ON trades FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Transactions: users can view own
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Leaderboard: viewable by all
CREATE POLICY "Leaderboard viewable by all"
    ON leaderboard_entries FOR SELECT USING (true);

-- Friendships: viewable by involved parties
CREATE POLICY "Friendships viewable by involved"
    ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friend requests"
    ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Achievements: viewable by all, managed by system
CREATE POLICY "Achievements viewable by all"
    ON achievements FOR SELECT USING (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create wallet on profile creation
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_profile_created AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- Auto-create leaderboard entries for new profile
CREATE OR REPLACE FUNCTION create_leaderboard_entries()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leaderboard_entries (user_id, market_type) VALUES
        (NEW.id, 'hunt'),
        (NEW.id, 'racing'),
        (NEW.id, 'fishing'),
        (NEW.id, 'farm'),
        (NEW.id, 'survival');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_profile_leaderboard AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_leaderboard_entries();

-- Update match player count
CREATE OR REPLACE FUNCTION update_match_player_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE matches SET current_players = (
        SELECT COUNT(*) FROM match_players WHERE match_id = NEW.match_id AND left_at IS NULL
    ) WHERE id = NEW.match_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_match_player_change AFTER INSERT OR UPDATE OR DELETE ON match_players
    FOR EACH ROW EXECUTE FUNCTION update_match_player_count();

-- Platform XP calculation
CREATE OR REPLACE FUNCTION add_platform_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID AS $$
DECLARE
    current_xp INTEGER;
    current_level INTEGER;
    xp_needed INTEGER;
BEGIN
    SELECT platform_xp, platform_level INTO current_xp, current_level
    FROM profiles WHERE id = p_user_id;

    current_xp := current_xp + p_xp;
    xp_needed := current_level * 1000;

    WHILE current_xp >= xp_needed LOOP
        current_xp := current_xp - xp_needed;
        current_level := current_level + 1;
        xp_needed := current_level * 1000;
    END LOOP;

    UPDATE profiles SET platform_xp = current_xp, platform_level = current_level
    WHERE id = p_user_id;
END;
$$ language 'plpgsql';

-- ELO update after match
CREATE OR REPLACE FUNCTION update_elo_after_match(
    p_user_id UUID,
    p_market_type TEXT,
    p_won BOOLEAN,
    p_score INTEGER,
    p_season INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    current_elo INTEGER;
    k_factor INTEGER := 32;
    expected_score DECIMAL;
    actual_score DECIMAL;
    opponent_avg_elo INTEGER;
BEGIN
    SELECT elo INTO current_elo FROM leaderboard_entries
    WHERE user_id = p_user_id AND market_type = p_market_type AND season = p_season;

    IF current_elo IS NULL THEN
        current_elo := 1000;
    END IF;

    -- Dynamic K-factor based on matches played
    SELECT CASE WHEN total_matches < 30 THEN 40 WHEN total_matches < 100 THEN 32 ELSE 24 END
    INTO k_factor FROM leaderboard_entries
    WHERE user_id = p_user_id AND market_type = p_market_type AND season = p_season;

    actual_score := CASE WHEN p_won THEN 1.0 WHEN p_score > 0 THEN 0.5 ELSE 0.0 END;
    expected_score := 1.0 / (1.0 + POWER(10.0, (opponent_avg_elo - current_elo)::DECIMAL / 400.0));

    UPDATE leaderboard_entries SET
        elo = GREATEST(100, current_elo + (k_factor * (actual_score - expected_score))::INTEGER),
        wins = wins + CASE WHEN p_won THEN 1 ELSE 0 END,
        losses = losses + CASE WHEN NOT p_won AND p_score = 0 THEN 1 ELSE 0 END,
        draws = draws + CASE WHEN NOT p_won AND p_score > 0 THEN 1 ELSE 0 END,
        total_matches = total_matches + 1,
        total_score = total_score + p_score,
        updated_at = NOW()
    WHERE user_id = p_user_id AND market_type = p_market_type AND season = p_season;
END;
$$ language 'plpgsql';
