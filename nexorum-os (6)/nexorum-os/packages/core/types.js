export interface Player {
  id: string;
  username: string;
  elo: number;
  level: number;
  reputation: number;
}

export interface Market {
  id: string;
  name: string;
  maxPlayers: number;
  pvp: boolean;
  duration: number;
}

export interface Item {
  id: string;
  name: string;
  rarity: number;
  marketSource: string;
  metadata: Record<string, any>;
}
