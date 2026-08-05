-- packages/db/schema/nexorum_schema.sql
-- NEXORUM Database Schema (Supabase / PostgreSQL)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users & Profiles ──────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  platform_level INTEGER NOT NULL DEFAULT 1,
  platform_xp INTEGER NOT NULL DEFAULT 0,
  reputation INTEGER NOT NULL DEFAULT 50 CHECK (reputation >= 0 AND reputation <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned', 'muted', 'suspended')),
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Wallets & Balances ────────────────────────────────────────────

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('nexo', 'hunt', 'race', 'fish', 'farm', 'surv', 'craft', 'event')),
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  locked_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token_type)
);

-- ─── Staking ───────────────────────────────────────────────────────

CREATE TABLE staking_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL CHECK (tier_id IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  amount DECIMAL(20, 8) NOT NULL,
  staked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlocks_at TIMESTAMPTZ NOT NULL,
  accrued_rewards DECIMAL(20, 8) NOT NULL DEFAULT 0,
  claimed_rewards DECIMAL(20, 8) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unlocked', 'claimed', 'early_withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Items & Inventory ─────────────────────────────────────────────

CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'celestial', 'primordial')),
  category TEXT NOT NULL CHECK (category IN ('weapon', 'armor', 'consumable', 'material', 'cosmetic', 'token')),
  market_id TEXT NOT NULL CHECK (market_id IN ('global', 'hunt', 'racing', 'fishing', 'farm', 'survival')),
  stats JSONB NOT NULL DEFAULT '{}',
  stackable BOOLEAN NOT NULL DEFAULT FALSE,
  max_stack INTEGER NOT NULL DEFAULT 1,
  is_tradeable BOOLEAN NOT NULL DEFAULT TRUE,
  is_nft BOOLEAN NOT NULL DEFAULT FALSE,
  asset_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  instance_id TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  is_bound BOOLEAN NOT NULL DEFAULT FALSE,
  market_source TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Skins ─────────────────────────────────────────────────────────

CREATE TABLE skins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  market_id TEXT NOT NULL,
  layers JSONB NOT NULL DEFAULT '[]',
  total_power INTEGER NOT NULL DEFAULT 0,
  is_tradeable BOOLEAN NOT NULL DEFAULT TRUE,
  is_nft BOOLEAN NOT NULL DEFAULT FALSE,
  minted_at TIMESTAMPTZ,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Markets & Matches ─────────────────────────────────────────────

CREATE TABLE markets (
  id TEXT PRIMARY KEY CHECK (id IN ('hunt', 'racing', 'fishing', 'farm', 'survival', 'global')),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'event', 'closed')),
  max_players INTEGER NOT NULL,
  drop_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
  xp_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
  current_event_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id TEXT NOT NULL REFERENCES markets(id),
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'duo', 'squad', 'guild_war', 'tournament')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'in_progress', 'finished', 'cancelled')),
  server_region TEXT NOT NULL,
  map_id TEXT NOT NULL,
  winner_id UUID REFERENCES profiles(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  team INTEGER NOT NULL DEFAULT 0,
  elo INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  nexo_earned DECIMAL(20, 8) NOT NULL DEFAULT 0,
  xp_gained INTEGER NOT NULL DEFAULT 0,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Parties ───────────────────────────────────────────────────────

CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES profiles(id),
  mode TEXT NOT NULL,
  market_id TEXT NOT NULL,
  max_size INTEGER NOT NULL DEFAULT 4,
  voice_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE party_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  ready BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

-- ─── Guilds ────────────────────────────────────────────────────────

CREATE TABLE guilds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL UNIQUE,
  emblem TEXT,
  leader_id UUID NOT NULL REFERENCES profiles(id),
  max_members INTEGER NOT NULL DEFAULT 100,
  treasury DECIMAL(20, 8) NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_recruiting BOOLEAN NOT NULL DEFAULT TRUE,
  requirements JSONB NOT NULL DEFAULT '{}',
  wars_won INTEGER NOT NULL DEFAULT 0,
  wars_lost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE guild_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member', 'recruit')),
  contribution DECIMAL(20, 8) NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(guild_id, user_id)
);

-- ─── Trading & Escrow ──────────────────────────────────────────────

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES profiles(id),
  to_user_id UUID NOT NULL REFERENCES profiles(id),
  offer_items JSONB NOT NULL DEFAULT '[]',
  request_items JSONB NOT NULL DEFAULT '[]',
  offer_nexo DECIMAL(20, 8) NOT NULL DEFAULT 0,
  request_nexo DECIMAL(20, 8) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

-- ─── Transactions ──────────────────────────────────────────────────

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'stake', 'unstake', 'trade', 'swap', 'burn', 'fee')),
  token_type TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  balance_after DECIMAL(20, 8) NOT NULL,
  market_id TEXT,
  match_id UUID REFERENCES matches(id),
  trade_id UUID REFERENCES trades(id),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Leaderboards ──────────────────────────────────────────────────

CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id TEXT NOT NULL REFERENCES markets(id),
  season_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  nexo_earned DECIMAL(20, 8) NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(market_id, season_id, user_id)
);

-- ─── Reports & Moderation ──────────────────────────────────────────

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  target_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('cheating', 'harassment', 'scam', 'bug_abuse', 'other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  description TEXT,
  evidence JSONB NOT NULL DEFAULT '[]',
  resolved_by UUID REFERENCES profiles(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ─── Friends ───────────────────────────────────────────────────────

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ─── Achievements ──────────────────────────────────────────────────

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  reward_nexo DECIMAL(20, 8) NOT NULL DEFAULT 0,
  reward_item_id UUID REFERENCES items(id),
  requirements JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ─── Indexes ───────────────────────────────────────────────────────

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_inventory_equipped ON inventory(user_id, is_equipped);
CREATE INDEX idx_matches_market ON matches(market_id, status);
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_leaderboard_market_season ON leaderboard_entries(market_id, season_id, rank);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_friendships_user ON friendships(user_id);

-- ─── RLS Policies ──────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own inventory" ON inventory FOR SELECT USING (auth.uid() = user_id);

-- Admin bypass
CREATE POLICY "Admins can view all" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- ─── Functions ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER markets_updated_at BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed markets
INSERT INTO markets (id, name, max_players) VALUES
  ('hunt', 'Hunt Market', 100),
  ('racing', 'Racing Market', 50),
  ('fishing', 'Fishing Market', 200),
  ('farm', 'Farm Market', 500),
  ('survival', 'Survival Market', 80),
  ('global', 'Global Market', 0)
ON CONFLICT (id) DO NOTHING;
