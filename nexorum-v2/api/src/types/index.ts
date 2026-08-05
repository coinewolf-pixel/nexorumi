// =====================================================
// NEXORUM API TYPES
// =====================================================

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  OPENAI_API_KEY: string;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  NEXORUM_CACHE: KVNamespace;
  MATCHMAKING_POOL: DurableObjectNamespace;
  VOICE_ROOM: DurableObjectNamespace;
}

export interface User {
  id: string;
  email: string;
  username: string;
  platform_level: number;
  platform_xp: number;
  reputation: number;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  platform_level: number;
  platform_xp: number;
  reputation: number;
  status: string;
  country: string | null;
  last_active_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  nexo_balance: number;
  nexo_staked: number;
  nexo_earned: number;
  eth_address: string | null;
  sol_address: string | null;
  btc_address: string | null;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  category: string;
  rarity: string;
  market_type: string;
  image_url: string | null;
  metadata: Record<string, any>;
  base_price: number;
  max_supply: number | null;
  current_supply: number;
  is_tradable: boolean;
  is_nft: boolean;
}

export interface Match {
  id: string;
  market_type: string;
  status: string;
  mode: string;
  max_players: number;
  current_players: number;
  host_id: string | null;
  map_name: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  winner_id: string | null;
  metadata: Record<string, any>;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  user_id: string;
  team: number;
  role: string | null;
  score: number;
  kills: number;
  deaths: number;
  assists: number;
  placement: number | null;
  reward_nexo: number;
}

export interface Party {
  id: string;
  name: string;
  leader_id: string;
  max_members: number;
  status: string;
  voice_channel_id: string | null;
  target_market: string | null;
}

export interface Guild {
  id: string;
  name: string;
  tag: string | null;
  description: string | null;
  emblem_url: string | null;
  leader_id: string;
  level: number;
  xp: number;
  max_members: number;
  treasury_nexo: number;
}

export interface Trade {
  id: string;
  seller_id: string;
  buyer_id: string | null;
  item_id: string;
  quantity: number;
  price_nexo: number;
  status: string;
  market_type: string;
  expires_at: string | null;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  market_type: string;
  season: number;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  total_matches: number;
  total_score: number;
  rank_position: number | null;
  tier: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  name: string;
  description: string | null;
  category: string;
  rarity: string;
  progress: number;
  target: number;
  completed: boolean;
  completed_at: string | null;
  reward_nexo: number;
}

export interface MatchmakingProfile {
  user_id: string;
  elo: number;
  latency: number;
  playstyle: number[];
  toxicity_score: number;
  preferred_role: string;
  activity_score: number;
  last_match_at: string | null;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  party_id: string | null;
  guild_id: string | null;
  content: string;
  type: string;
  created_at: string;
}
