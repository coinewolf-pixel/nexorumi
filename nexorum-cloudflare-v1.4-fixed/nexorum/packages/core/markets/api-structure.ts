// packages/core/markets/api-structure.ts
// NEXORUM Market API — Unified interface for all 6 markets

export type MarketId = 'hunt' | 'racing' | 'fishing' | 'farm' | 'survival' | 'global';

export interface MarketState {
  marketId: MarketId;
  status: 'active' | 'maintenance' | 'event' | 'closed';
  activePlayers: number;
  queuedPlayers: number;
  currentEvent?: GameEvent;
  season: SeasonInfo;
  lastUpdate: string;
}

export interface SeasonInfo {
  id: string;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  rewards: SeasonReward[];
}

export interface SeasonReward {
  rank: number;
  nexoReward: number;
  exclusiveItemId?: string;
}

export interface GameEvent {
  id: string;
  name: string;
  type: 'double_xp' | 'drop_boost' | 'tournament' | 'seasonal';
  multiplier: number;
  startTime: string;
  endTime: string;
  description: string;
}

export interface PlayerAction {
  userId: string;
  actionType: string;
  payload: Record<string, unknown>;
  timestamp: string;
  signature: string; // anti-cheat
}

export interface ActionResult {
  success: boolean;
  nexoEarned: number;
  xpGained: number;
  itemsDropped: string[];
  achievementsUnlocked: string[];
  newState: Record<string, unknown>;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  nexoEarned: number;
  winRate: number;
  gamesPlayed: number;
  lastActive: string;
}

export interface PlayerInventory {
  userId: string;
  marketId: MarketId;
  items: InventoryItem[];
  capacity: number;
  usedCapacity: number;
}

export interface InventoryItem {
  instanceId: string;
  itemId: string;
  name: string;
  rarity: string;
  quantity: number;
  isEquipped: boolean;
  acquiredAt: string;
  marketSource: MarketId;
}

export interface TradeOffer {
  id: string;
  fromUserId: string;
  toUserId: string;
  offerItems: TradeItem[];
  requestItems: TradeItem[];
  offerNexo: number;
  requestNexo: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface TradeItem {
  instanceId: string;
  itemId: string;
  name: string;
  quantity: number;
}

// ─── Market API Contract ───────────────────────────────────────────

export interface IMarketAPI {
  // State
  getState(): Promise<MarketState>;
  getPlayerState(userId: string): Promise<Record<string, unknown>>;

  // Actions
  performAction(action: PlayerAction): Promise<ActionResult>;
  validateAction(action: PlayerAction): Promise<boolean>;

  // Leaderboard
  getLeaderboard(limit?: number, offset?: number): Promise<LeaderboardEntry[]>;
  getPlayerRank(userId: string): Promise<number>;

  // Inventory
  getInventory(userId: string): Promise<PlayerInventory>;
  equipItem(userId: string, instanceId: string): Promise<boolean>;
  unequipItem(userId: string, instanceId: string): Promise<boolean>;

  // Trading
  createTrade(offer: Omit<TradeOffer, 'id' | 'status' | 'createdAt'>): Promise<TradeOffer>;
  respondToTrade(tradeId: string, accept: boolean): Promise<TradeOffer>;
  getActiveTrades(userId: string): Promise<TradeOffer[]>;

  // Real-time (WebSocket)
  subscribeToEvents(userId: string, callback: (event: MarketEvent) => void): () => void;
}

export interface MarketEvent {
  type: 'player_join' | 'player_leave' | 'action_result' | 'event_start' | 'event_end' | 'price_update' | 'system';
  marketId: MarketId;
  timestamp: string;
  data: Record<string, unknown>;
}

// ─── Market-Specific Configs ───────────────────────────────────────

export const MARKET_CONFIGS: Record<MarketId, { name: string; maxPlayers: number; actionTypes: string[]; pvp: boolean }> = {
  hunt:     { name: 'Hunt Market',     maxPlayers: 100, actionTypes: ['shoot', 'track', 'loot', 'craft_trap', 'skin'],        pvp: true },
  racing:   { name: 'Racing Market',     maxPlayers: 50,  actionTypes: ['race', 'drift', 'upgrade', 'bet', 'tune'],           pvp: true },
  fishing:  { name: 'Fishing Market',    maxPlayers: 200, actionTypes: ['cast', 'reel', 'sell', 'craft_bait', 'explore'],     pvp: false },
  farm:     { name: 'Farm Market',       maxPlayers: 500, actionTypes: ['plant', 'harvest', 'water', 'breed', 'sell_crop'],   pvp: false },
  survival: { name: 'Survival Market',   maxPlayers: 80,  actionTypes: ['gather', 'build', 'fight', 'craft', 'explore_map'],  pvp: true },
  global:   { name: 'Global Market',     maxPlayers: 0,   actionTypes: ['trade', 'stake', 'swap', 'vote', 'claim'],           pvp: false },
};

// ─── Mock Implementation (for dev/testing) ─────────────────────────

export class MockMarketAPI implements IMarketAPI {
  constructor(private marketId: MarketId) {}

  async getState(): Promise<MarketState> {
    return {
      marketId: this.marketId,
      status: 'active',
      activePlayers: Math.floor(Math.random() * MARKET_CONFIGS[this.marketId].maxPlayers),
      queuedPlayers: Math.floor(Math.random() * 20),
      season: {
        id: `s1_${this.marketId}`,
        name: `Season 1 — ${MARKET_CONFIGS[this.marketId].name}`,
        number: 1,
        startDate: '2026-01-01',
        endDate: '2026-04-01',
        rewards: [
          { rank: 1, nexoReward: 100000, exclusiveItemId: 'legendary_crown' },
          { rank: 10, nexoReward: 50000 },
          { rank: 100, nexoReward: 10000 },
        ],
      },
      lastUpdate: new Date().toISOString(),
    };
  }

  async getPlayerState(userId: string): Promise<Record<string, unknown>> {
    return { userId, level: Math.floor(Math.random() * 100), xp: Math.floor(Math.random() * 10000) };
  }

  async performAction(action: PlayerAction): Promise<ActionResult> {
    return {
      success: true,
      nexoEarned: Math.floor(Math.random() * 100),
      xpGained: Math.floor(Math.random() * 500),
      itemsDropped: [],
      achievementsUnlocked: [],
      newState: {},
    };
  }

  async validateAction(action: PlayerAction): Promise<boolean> {
    return action.signature.length > 10;
  }

  async getLeaderboard(limit = 50, offset = 0): Promise<LeaderboardEntry[]> {
    return Array.from({ length: limit }, (_, i) => ({
      rank: offset + i + 1,
      userId: `user_${i}`,
      username: `Player_${i}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      score: Math.floor(Math.random() * 1000000),
      nexoEarned: Math.floor(Math.random() * 50000),
      winRate: Math.random() * 100,
      gamesPlayed: Math.floor(Math.random() * 1000),
      lastActive: new Date().toISOString(),
    }));
  }

  async getPlayerRank(userId: string): Promise<number> {
    return Math.floor(Math.random() * 10000) + 1;
  }

  async getInventory(userId: string): Promise<PlayerInventory> {
    return {
      userId,
      marketId: this.marketId,
      items: [],
      capacity: 100,
      usedCapacity: 0,
    };
  }

  async equipItem(): Promise<boolean> { return true; }
  async unequipItem(): Promise<boolean> { return true; }

  async createTrade(offer: Omit<TradeOffer, 'id' | 'status' | 'createdAt'>): Promise<TradeOffer> {
    return {
      ...offer,
      id: `trade_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    } as TradeOffer;
  }

  async respondToTrade(tradeId: string, accept: boolean): Promise<TradeOffer> {
    return {
      id: tradeId,
      fromUserId: '', toUserId: '',
      offerItems: [], requestItems: [],
      offerNexo: 0, requestNexo: 0,
      status: accept ? 'accepted' : 'declined',
      createdAt: '', expiresAt: '',
    };
  }

  async getActiveTrades(userId: string): Promise<TradeOffer[]> {
    return [];
  }

  subscribeToEvents(_userId: string, callback: (event: MarketEvent) => void): () => void {
    const interval = setInterval(() => {
      callback({
        type: 'price_update',
        marketId: this.marketId,
        timestamp: new Date().toISOString(),
        data: { price: Math.random() * 100 },
      });
    }, 5000);
    return () => clearInterval(interval);
  }
}
