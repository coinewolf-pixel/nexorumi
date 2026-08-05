export const TOKEN_PRICES = {
  nexo: 0.10, hunt: 0.05, race: 0.05, fish: 0.03, farm: 0.02, surv: 0.04,
};

export const STAKING_TIERS = [
  { name: 'Bronze', lockDays: 7, apy: 8, minAmount: 100, xpBoost: 5 },
  { name: 'Silver', lockDays: 30, apy: 14, minAmount: 500, xpBoost: 10 },
  { name: 'Gold', lockDays: 90, apy: 22, minAmount: 2000, xpBoost: 15 },
  { name: 'Platinum', lockDays: 180, apy: 35, minAmount: 10000, xpBoost: 25 },
  { name: 'Diamond', lockDays: 365, apy: 50, minAmount: 50000, xpBoost: 40 },
];

export const RARITY_COLORS = [
  '#9CA3AF', '#22C55E', '#3B82F6', '#A855F7', '#F59E0B', '#EF4444', '#06B6D4', '#E879F9'
];
