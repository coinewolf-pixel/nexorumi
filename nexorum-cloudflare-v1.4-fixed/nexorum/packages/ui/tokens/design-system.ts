// packages/ui/tokens/design-system.ts
// NEXORUM Design System — Tokens, Skins, Rarity

export const RARITY_TIERS = [
  { id: 1, name: 'common',     label: 'Common',     dropRate: 0.60,  color: '#9CA3AF', glow: 'none',    multiplier: 1.0 },
  { id: 2, name: 'uncommon',   label: 'Uncommon',   dropRate: 0.25,  color: '#22C55E', glow: 'subtle',  multiplier: 1.2 },
  { id: 3, name: 'rare',       label: 'Rare',       dropRate: 0.10,  color: '#3B82F6', glow: 'soft',    multiplier: 1.5 },
  { id: 4, name: 'epic',       label: 'Epic',       dropRate: 0.035, color: '#A855F7', glow: 'medium',  multiplier: 2.0 },
  { id: 5, name: 'legendary',  label: 'Legendary',  dropRate: 0.01,  color: '#F59E0B', glow: 'strong',  multiplier: 3.0 },
  { id: 6, name: 'mythic',     label: 'Mythic',     dropRate: 0.004, color: '#EF4444', glow: 'intense', multiplier: 5.0 },
  { id: 7, name: 'celestial',  label: 'Celestial',  dropRate: 0.0008,color: '#06B6D4', glow: 'pulsing', multiplier: 8.0 },
  { id: 8, name: 'primordial', label: 'Primordial', dropRate: 0.0002,color: '#E879F9', glow: 'aura',    multiplier: 15.0 },
] as const;

export type RarityName = typeof RARITY_TIERS[number]['name'];

export interface SkinLayer {
  id: string;
  name: string;
  type: 'base' | 'texture' | 'particle' | 'sound';
  rarity: RarityName;
  market: 'global' | 'hunt' | 'racing' | 'fishing' | 'farm' | 'survival';
  assetUrl: string;
  metadata: Record<string, unknown>;
}

export interface Skin {
  id: string;
  name: string;
  rarity: RarityName;
  market: string;
  layers: SkinLayer[];
  totalPower: number; // computed from layers + rarity multiplier
  isTradeable: boolean;
  isNFT: boolean;
  mintedAt: string;
  ownerId: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: RarityName;
  category: 'weapon' | 'armor' | 'consumable' | 'material' | 'cosmetic' | 'token';
  market: string;
  stats: Record<string, number>;
  skin?: Skin;
  stackable: boolean;
  maxStack: number;
  isBound: boolean;
}

export const TOKEN_TYPES = [
  { id: 'nexo',        name: 'NEXO',        tradeable: true,  stakable: true,  market: 'global' },
  { id: 'hunt_token',  name: 'HUNT',        tradeable: true,  stakable: false, market: 'hunt' },
  { id: 'race_token',  name: 'RACE',        tradeable: true,  stakable: false, market: 'racing' },
  { id: 'fish_token',  name: 'FISH',        tradeable: true,  stakable: false, market: 'fishing' },
  { id: 'farm_token',  name: 'FARM',        tradeable: true,  stakable: false, market: 'farm' },
  { id: 'surv_token',  name: 'SURV',        tradeable: true,  stakable: false, market: 'survival' },
  { id: 'craft_token', name: 'Craft Shard', tradeable: false, stakable: false, market: 'global' },
  { id: 'event_token', name: 'Event Token', tradeable: true,  stakable: false, market: 'global' },
] as const;

export function getRarityByName(name: RarityName) {
  return RARITY_TIERS.find(t => t.name === name)!;
}

export function computeItemPower(item: Item): number {
  const rarity = getRarityByName(item.rarity);
  const basePower = Object.values(item.stats).reduce((a, b) => a + b, 0);
  return Math.round(basePower * rarity.multiplier);
}

export function getGlowClass(rarity: RarityName): string {
  const tier = getRarityByName(rarity);
  return `glow-${tier.glow}`;
}

export function rollRarity(bonusLuck = 0): RarityName {
  const roll = Math.random() + bonusLuck;
  let cumulative = 0;
  for (const tier of RARITY_TIERS) {
    cumulative += tier.dropRate;
    if (roll <= cumulative) return tier.name;
  }
  return 'primordial';
}
