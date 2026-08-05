-- NEXORUM OS — Full Database Schema
-- Run this in Supabase SQL Editor

-- Enable RLS extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  platform_level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  reputation INTEGER DEFAULT 50,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned', 'muted')),
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin', 'superadmin')),
  region TEXT DEFAULT 'us-east',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('nexo', 'hunt', 'race', 'fish', 'farm', 'surv')),
  balance BIGINT DEFAULT 0,
  locked BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token_type)
);

-- Staking
CREATE TABLE staking_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')),
  amount BIGINT NOT NULL,
  apy DECIMAL(5,2) NOT NULL,
  lock_until TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired')),
  rewards_earned BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items & Inventory
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  rarity INTEGER NOT NULL CHECK (rarity BETWEEN 1 AND 8),
  market_source TEXT NOT NULL,
  token_type TEXT,
  metadata JSONB DEFAULT '{}',
  is_nft BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  equipped BOOLEAN DEFAULT false,
  UNIQUE(user_id, item_id)
);

-- Skins
CREATE TABLE skins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  base_layer TEXT NOT NULL,
  texture TEXT,
  particles TEXT,
  sound_override TEXT,
  equipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Markets
CREATE TABLE markets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'event')),
  event_name TEXT,
  drop_multiplier DECIMAL(3,1) DEFAULT 1.0,
  xp_multiplier DECIMAL(3,1) DEFAULT 1.0,
  max_players INTEGER NOT NULL,
  pvp BOOLEAN DEFAULT false,
  duration INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL REFERENCES markets(id),
  mode TEXT NOT NULL,
  map_id TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'in_progress', 'finished', 'cancelled')),
  server_region TEXT,
  winner_id UUID REFERENCES profiles(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  team INTEGER DEFAULT 0,
  elo INTEGER,
  score INTEGER DEFAULT 0,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  is_bot BOOLEAN DEFAULT false,
  UNIQUE(match_id, user_id)
);

-- Parties
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES profiles(id),
  market_id TEXT REFERENCES markets(id),
  mode TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_queue', 'in_match')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE party_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

-- Guilds
CREATE TABLE guilds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL,
  leader_id UUID NOT NULL REFERENCES profiles(id),
  description TEXT,
  treasury_nexo BIGINT DEFAULT 0,
  is_recruiting BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guild_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'officer', 'leader')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, user_id)
);

-- Trades
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  buyer_id UUID REFERENCES profiles(id),
  item_id UUID REFERENCES items(id),
  token_type TEXT NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'trade', 'stake', 'unstake', 'burn', 'deposit', 'withdraw')),
  token_type TEXT NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboards
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id TEXT NOT NULL REFERENCES markets(id),
  season_id TEXT NOT NULL DEFAULT 'current',
  user_id UUID NOT NULL REFERENCES profiles(id),
  rank INTEGER NOT NULL,
  score BIGINT NOT NULL,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(market_id, season_id, user_id)
);

-- Reports & Moderation
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  target_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('cheating', 'harassment', 'scam', 'bug_abuse')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  description TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friendships
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- Insert default markets
INSERT INTO markets (id, name, max_players, pvp, duration) VALUES
('hunt', 'Hunt Market', 100, true, 15),
('racing', 'Racing Market', 50, true, 5),
('fishing', 'Fishing Market', 200, false, 30),
('farm', 'Farm Market', 500, false, 60),
('survival', 'Survival Market', 80, true, 20);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own inventory"
  ON inventory FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);
