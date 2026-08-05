// packages/core/economy/nexo-economy.ts
// NEXORUM Economy Engine — Emission, Staking, Cross-Market Exchange

export const NEXO_CONFIG = {
  totalSupply: 1_000_000_000,
  initialDistribution: {
    gameplay: 0.40,
    team: 0.20,
    treasury: 0.15,
    liquidity: 0.15,
    airdrops: 0.07,
    reserve: 0.03,
  },
  halvingIntervalYears: 2,
  burnRate: 0.02, // 2% per marketplace tx
  crossMarketFee: 0.015, // 1.5%
  platformFee: 0.025, // 2.5% per trade
} as const;

export interface StakingTier {
  id: string;
  name: string;
  lockDays: number;
  apy: number;
  xpBoost: number;
  feeDiscount: number;
  perks: string[];
  minAmount: number;
}

export const STAKING_TIERS: StakingTier[] = [
  { id: 'bronze',   name: 'Bronze',   lockDays: 7,   apy: 0.08,  xpBoost: 1.05, feeDiscount: 0.05,  minAmount: 100,   perks: ['+5% XP boost'] },
  { id: 'silver',   name: 'Silver',   lockDays: 30,  apy: 0.14,  xpBoost: 1.10, feeDiscount: 0.10,  minAmount: 500,   perks: ['+10% XP', '5% fee discount'] },
  { id: 'gold',     name: 'Gold',     lockDays: 90,  apy: 0.22,  xpBoost: 1.15, feeDiscount: 0.10,  minAmount: 2000,  perks: ['+15% XP', '10% fee discount', 'Exclusive drops'] },
  { id: 'platinum', name: 'Platinum', lockDays: 180, apy: 0.35,  xpBoost: 1.25, feeDiscount: 0.20,  minAmount: 10000, perks: ['+25% XP', '20% fee discount', 'Early access'] },
  { id: 'diamond',  name: 'Diamond',  lockDays: 365, apy: 0.50,  xpBoost: 1.40, feeDiscount: 0.30,  minAmount: 50000, perks: ['+40% XP', '30% fee discount', 'Governance vote'] },
];

export interface StakePosition {
  id: string;
  userId: string;
  tierId: string;
  amount: number;
  stakedAt: Date;
  unlocksAt: Date;
  accruedRewards: number;
  claimedRewards: number;
  status: 'active' | 'unlocked' | 'claimed';
}

export interface MarketPool {
  marketId: string;
  nexoLiquidity: number;
  tokenLiquidity: number;
  volatility: number; // 0.0 - 1.0
  lastUpdated: Date;
}

export interface CrossMarketSwap {
  id: string;
  userId: string;
  fromMarket: string;
  toMarket: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  timestamp: Date;
}

// ─── Emission Engine ───────────────────────────────────────────────

export class EmissionEngine {
  private startDate: Date;
  private halvingYears: number;
  private baseReward: number;

  constructor(startDate: Date = new Date('2026-01-01'), baseReward = 100) {
    this.startDate = startDate;
    this.halvingYears = NEXO_CONFIG.halvingIntervalYears;
    this.baseReward = baseReward;
  }

  getCurrentHalvingPeriod(): number {
    const now = new Date();
    const years = (now.getTime() - this.startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return Math.floor(years / this.halvingYears);
  }

  getRewardMultiplier(): number {
    const period = this.getCurrentHalvingPeriod();
    return Math.pow(0.5, period);
  }

  calculateActionReward(baseValue: number): number {
    return baseValue * this.getRewardMultiplier();
  }

  getRemainingSupply(totalMinted: number): number {
    return NEXO_CONFIG.totalSupply - totalMinted;
  }
}

// ─── Staking Engine ────────────────────────────────────────────────

export class StakingEngine {
  calculateAPY(tier: StakingTier, globalBoost = 1.0): number {
    return tier.apy * globalBoost;
  }

  calculateDailyReward(position: StakePosition, tier: StakingTier): number {
    const apy = this.calculateAPY(tier);
    return (position.amount * apy) / 365;
  }

  calculateTotalAccrued(position: StakePosition, tier: StakingTier): number {
    const now = new Date();
    const daysStaked = Math.max(0, (now.getTime() - position.stakedAt.getTime()) / (1000 * 60 * 60 * 24));
    const daily = this.calculateDailyReward(position, tier);
    return daily * daysStaked;
  }

  canUnstake(position: StakePosition): boolean {
    return new Date() >= position.unlocksAt;
  }

  getEarlyUnstakePenalty(position: StakePosition, tier: StakingTier): number {
    if (this.canUnstake(position)) return 0;
    const daysRemaining = (position.unlocksAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    const penaltyRate = Math.min(0.5, daysRemaining / tier.lockDays * 0.5);
    return position.amount * penaltyRate;
  }
}

// ─── Cross-Market Exchange ─────────────────────────────────────────

export class CrossMarketExchange {
  pools: Map<string, MarketPool> = new Map();

  setPool(pool: MarketPool) {
    this.pools.set(pool.marketId, pool);
  }

  getRate(fromMarket: string, toMarket: string): number {
    const from = this.pools.get(fromMarket);
    const to = this.pools.get(toMarket);
    if (!from || !to) throw new Error('Pool not found');

    const baseRate = (from.nexoLiquidity / from.tokenLiquidity) / (to.nexoLiquidity / to.tokenLiquidity);
    const volatilityFactor = 1 + (from.volatility + to.volatility) / 2 * 0.1;
    return baseRate * volatilityFactor;
  }

  swap(userId: string, fromMarket: string, toMarket: string, fromAmount: number): CrossMarketSwap {
    const rate = this.getRate(fromMarket, toMarket);
    const grossToAmount = fromAmount * rate;
    const fee = grossToAmount * NEXO_CONFIG.crossMarketFee;
    const toAmount = grossToAmount - fee;

    return {
      id: `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      fromMarket,
      toMarket,
      fromAmount,
      toAmount,
      rate,
      fee,
      timestamp: new Date(),
    };
  }

  getMarketDepth(marketId: string): { buyDepth: number; sellDepth: number } {
    const pool = this.pools.get(marketId);
    if (!pool) return { buyDepth: 0, sellDepth: 0 };
    return {
      buyDepth: pool.nexoLiquidity * 0.3,
      sellDepth: pool.tokenLiquidity * 0.3,
    };
  }
}

// ─── Burn Engine ───────────────────────────────────────────────────

export class BurnEngine {
  private totalBurned = 0;

  processMarketplaceTransaction(amount: number): { net: number; burned: number } {
    const burned = amount * NEXO_CONFIG.burnRate;
    this.totalBurned += burned;
    return { net: amount - burned, burned };
  }

  getTotalBurned(): number {
    return this.totalBurned;
  }

  getDeflationRate(totalSupply: number): number {
    return this.totalBurned / totalSupply;
  }
}

// ─── Treasury Engine ───────────────────────────────────────────────

export class TreasuryEngine {
  private balance = NEXO_CONFIG.totalSupply * NEXO_CONFIG.initialDistribution.treasury;
  private allocations: Map<string, number> = new Map();

  allocate(category: string, amount: number): boolean {
    if (amount > this.balance) return false;
    this.balance -= amount;
    this.allocations.set(category, (this.allocations.get(category) || 0) + amount);
    return true;
  }

  getBalance(): number {
    return this.balance;
  }

  getAllocation(category: string): number {
    return this.allocations.get(category) || 0;
  }
}
