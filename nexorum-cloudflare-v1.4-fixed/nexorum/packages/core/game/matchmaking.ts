// packages/core/game/matchmaking.ts
// NEXORUM Matchmaking & Social Mechanics

export type GameMode = 'solo' | 'duo' | 'squad' | 'guild_war' | 'tournament';
export type MatchStatus = 'waiting' | 'starting' | 'in_progress' | 'finished' | 'cancelled';

export interface PlayerProfile {
  userId: string;
  username: string;
  avatar: string;
  platformLevel: number;
  elo: number;
  marketElos: Record<string, number>;
  region: string;
  latency: number; // ms
  partyId?: string;
  preferredModes: GameMode[];
  lastMatchAt?: Date;
  reputation: number; // 0-100
}

export interface Party {
  id: string;
  leaderId: string;
  members: PartyMember[];
  maxSize: number;
  mode: GameMode;
  marketId: string;
  createdAt: Date;
  voiceEnabled: boolean;
}

export interface PartyMember {
  userId: string;
  username: string;
  avatar: string;
  ready: boolean;
  role: 'leader' | 'member';
  joinedAt: Date;
}

export interface Match {
  id: string;
  marketId: string;
  mode: GameMode;
  status: MatchStatus;
  players: MatchPlayer[];
  startTime?: Date;
  endTime?: Date;
  winner?: string;
  serverRegion: string;
  mapId: string;
}

export interface MatchPlayer {
  userId: string;
  username: string;
  team: number;
  elo: number;
  latency: number;
  isBot: boolean;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  emblem: string;
  leaderId: string;
  officers: string[];
  members: GuildMember[];
  maxMembers: number;
  treasury: number; // NEXO
  level: number;
  xp: number;
  description: string;
  isRecruiting: boolean;
  requirements: GuildRequirements;
  warsWon: number;
  warsLost: number;
  createdAt: Date;
}

export interface GuildMember {
  userId: string;
  username: string;
  role: 'leader' | 'officer' | 'member' | 'recruit';
  joinedAt: Date;
  contribution: number;
  lastActive: Date;
}

export interface GuildRequirements {
  minLevel: number;
  minReputation: number;
  applicationRequired: boolean;
}

export interface TradeEscrow {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromItems: EscrowItem[];
  toItems: EscrowItem[];
  fromNexo: number;
  toNexo: number;
  status: 'pending_both' | 'pending_other' | 'completed' | 'cancelled';
  fromConfirmed: boolean;
  toConfirmed: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface EscrowItem {
  instanceId: string;
  itemId: string;
  name: string;
  rarity: string;
}

// ─── Matchmaking Engine ────────────────────────────────────────────

export class MatchmakingEngine {
  private queue: Map<string, PlayerProfile[]> = new Map(); // mode -> players
  private activeMatches: Map<string, Match> = new Map();
  private matchIdCounter = 0;

  constructor(
    private maxEloDiff = 200,
    private maxLatencyDiff = 100,
    private queueTimeoutMs = 30000,
    private botFillThreshold = 0.5, // fill with bots if < 50% real players
  ) {}

  enqueue(player: PlayerProfile, mode: GameMode, marketId: string): void {
    const key = `${marketId}:${mode}`;
    if (!this.queue.has(key)) this.queue.set(key, []);
    const list = this.queue.get(key)!;
    if (!list.find(p => p.userId === player.userId)) {
      list.push(player);
    }
  }

  dequeue(userId: string, mode: GameMode, marketId: string): void {
    const key = `${marketId}:${mode}`;
    const list = this.queue.get(key);
    if (list) {
      this.queue.set(key, list.filter(p => p.userId !== userId));
    }
  }

  tryMatch(mode: GameMode, marketId: string): Match | null {
    const key = `${marketId}:${mode}`;
    const players = this.queue.get(key) || [];
    const required = this.getRequiredPlayers(mode);

    if (players.length < required * this.botFillThreshold) return null;

    // Sort by ELO
    players.sort((a, b) => a.elo - b.elo);

    // Find a valid group
    const group = this.findValidGroup(players, required);
    if (!group) return null;

    // Remove from queue
    this.queue.set(key, players.filter(p => !group.find(g => g.userId === p.userId)));

    const match = this.createMatch(group, mode, marketId);
    this.activeMatches.set(match.id, match);
    return match;
  }

  private getRequiredPlayers(mode: GameMode): number {
    switch (mode) {
      case 'solo': return 1;
      case 'duo': return 2;
      case 'squad': return 4;
      case 'guild_war': return 20;
      case 'tournament': return 16;
      default: return 1;
    }
  }

  private findValidGroup(players: PlayerProfile[], required: number): PlayerProfile[] | null {
    for (let i = 0; i <= players.length - required; i++) {
      const candidate = players.slice(i, i + required);
      if (this.isValidGroup(candidate)) return candidate;
    }
    return null;
  }

  private isValidGroup(players: PlayerProfile[]): boolean {
    const elos = players.map(p => p.elo);
    const latencies = players.map(p => p.latency);
    const maxElo = Math.max(...elos);
    const minElo = Math.min(...elos);
    const maxLat = Math.max(...latencies);
    const minLat = Math.min(...latencies);
    return (maxElo - minElo) <= this.maxEloDiff && (maxLat - minLat) <= this.maxLatencyDiff;
  }

  private createMatch(players: PlayerProfile[], mode: GameMode, marketId: string): Match {
    this.matchIdCounter++;
    const matchPlayers: MatchPlayer[] = players.map((p, i) => ({
      userId: p.userId,
      username: p.username,
      team: mode === 'solo' ? i : Math.floor(i / (mode === 'duo' ? 2 : 4)),
      elo: p.elo,
      latency: p.latency,
      isBot: false,
    }));

    return {
      id: `match_${this.matchIdCounter}_${Date.now()}`,
      marketId,
      mode,
      status: 'waiting',
      players: matchPlayers,
      serverRegion: this.selectServerRegion(players),
      mapId: this.selectMap(marketId),
    };
  }

  private selectServerRegion(players: PlayerProfile[]): string {
    const regions = players.map(p => p.region);
    const counts = regions.reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc; }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'us-east';
  }

  private selectMap(marketId: string): string {
    const maps: Record<string, string[]> = {
      hunt: ['forest', 'desert', 'arctic', 'jungle'],
      racing: ['neon_city', 'coastal', 'mountain', 'space_station'],
      fishing: ['lake', 'ocean', 'river', 'deep_sea'],
      farm: ['meadow', 'valley', 'island', 'underground'],
      survival: ['wasteland', 'island', 'bunker', 'city_ruins'],
    };
    const pool = maps[marketId] || ['default'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getActiveMatch(matchId: string): Match | undefined {
    return this.activeMatches.get(matchId);
  }

  endMatch(matchId: string, winnerUserId?: string): Match | undefined {
    const match = this.activeMatches.get(matchId);
    if (match) {
      match.status = 'finished';
      match.endTime = new Date();
      match.winner = winnerUserId;
    }
    return match;
  }

  backfillMatch(matchId: string, botProfile: PlayerProfile): boolean {
    const match = this.activeMatches.get(matchId);
    if (!match || match.status !== 'in_progress') return false;
    match.players.push({
      userId: botProfile.userId,
      username: botProfile.username,
      team: match.players.length % 2,
      elo: botProfile.elo,
      latency: 20,
      isBot: true,
    });
    return true;
  }
}

// ─── Party Manager ─────────────────────────────────────────────────

export class PartyManager {
  private parties: Map<string, Party> = new Map();
  private userParty: Map<string, string> = new Map(); // userId -> partyId

  createParty(leaderId: string, leaderName: string, mode: GameMode, marketId: string, maxSize: number): Party {
    const party: Party = {
      id: `party_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      leaderId,
      members: [{ userId: leaderId, username: leaderName, avatar: '', ready: false, role: 'leader', joinedAt: new Date() }],
      maxSize,
      mode,
      marketId,
      createdAt: new Date(),
      voiceEnabled: false,
    };
    this.parties.set(party.id, party);
    this.userParty.set(leaderId, party.id);
    return party;
  }

  joinParty(partyId: string, userId: string, username: string): Party | null {
    const party = this.parties.get(partyId);
    if (!party || party.members.length >= party.maxSize) return null;
    if (this.userParty.has(userId)) this.leaveParty(userId);

    party.members.push({ userId, username, avatar: '', ready: false, role: 'member', joinedAt: new Date() });
    this.userParty.set(userId, partyId);
    return party;
  }

  leaveParty(userId: string): boolean {
    const partyId = this.userParty.get(userId);
    if (!partyId) return false;
    const party = this.parties.get(partyId);
    if (!party) return false;

    party.members = party.members.filter(m => m.userId !== userId);
    this.userParty.delete(userId);

    if (party.members.length === 0) {
      this.parties.delete(partyId);
    } else if (party.leaderId === userId) {
      party.leaderId = party.members[0].userId;
      party.members[0].role = 'leader';
    }
    return true;
  }

  setReady(userId: string, ready: boolean): boolean {
    const partyId = this.userParty.get(userId);
    if (!partyId) return false;
    const party = this.parties.get(partyId);
    if (!party) return false;
    const member = party.members.find(m => m.userId === userId);
    if (member) member.ready = ready;
    return true;
  }

  isPartyReady(partyId: string): boolean {
    const party = this.parties.get(partyId);
    return !!party && party.members.every(m => m.ready);
  }

  getPartyByUser(userId: string): Party | undefined {
    const partyId = this.userParty.get(userId);
    return partyId ? this.parties.get(partyId) : undefined;
  }

  disbandParty(partyId: string): void {
    const party = this.parties.get(partyId);
    if (party) {
      for (const m of party.members) this.userParty.delete(m.userId);
      this.parties.delete(partyId);
    }
  }
}

// ─── Guild Manager ─────────────────────────────────────────────────

export class GuildManager {
  private guilds: Map<string, Guild> = new Map();
  private userGuild: Map<string, string> = new Map();

  createGuild(leaderId: string, leaderName: string, name: string, tag: string): Guild {
    const guild: Guild = {
      id: `guild_${Date.now()}`,
      name,
      tag,
      emblem: '',
      leaderId,
      officers: [],
      members: [{ userId: leaderId, username: leaderName, role: 'leader', joinedAt: new Date(), contribution: 0, lastActive: new Date() }],
      maxMembers: 100,
      treasury: 0,
      level: 1,
      xp: 0,
      description: '',
      isRecruiting: true,
      requirements: { minLevel: 1, minReputation: 0, applicationRequired: false },
      warsWon: 0,
      warsLost: 0,
      createdAt: new Date(),
    };
    this.guilds.set(guild.id, guild);
    this.userGuild.set(leaderId, guild.id);
    return guild;
  }

  joinGuild(guildId: string, userId: string, username: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.members.length >= guild.maxMembers) return false;
    if (this.userGuild.has(userId)) return false;

    guild.members.push({ userId, username, role: 'recruit', joinedAt: new Date(), contribution: 0, lastActive: new Date() });
    this.userGuild.set(userId, guildId);
    return true;
  }

  leaveGuild(userId: string): boolean {
    const guildId = this.userGuild.get(userId);
    if (!guildId) return false;
    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    guild.members = guild.members.filter(m => m.userId !== userId);
    this.userGuild.delete(userId);

    if (guild.members.length === 0) {
      this.guilds.delete(guildId);
    } else if (guild.leaderId === userId) {
      const officer = guild.members.find(m => m.role === 'officer');
      const newLeader = officer || guild.members[0];
      guild.leaderId = newLeader.userId;
      newLeader.role = 'leader';
    }
    return true;
  }

  promoteMember(guildId: string, userId: string, newRole: 'officer' | 'member'): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;
    const member = guild.members.find(m => m.userId === userId);
    if (!member) return false;
    member.role = newRole;
    if (newRole === 'officer') guild.officers.push(userId);
    else guild.officers = guild.officers.filter(id => id !== userId);
    return true;
  }

  depositToTreasury(guildId: string, amount: number): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;
    guild.treasury += amount;
    return true;
  }

  addXp(guildId: string, xp: number): void {
    const guild = this.guilds.get(guildId);
    if (!guild) return;
    guild.xp += xp;
    const required = guild.level * 10000;
    if (guild.xp >= required) {
      guild.level++;
      guild.xp -= required;
      guild.maxMembers = Math.min(200, guild.maxMembers + 10);
    }
  }

  getGuildByUser(userId: string): Guild | undefined {
    const guildId = this.userGuild.get(userId);
    return guildId ? this.guilds.get(guildId) : undefined;
  }
}

// ─── Trade Escrow Manager ──────────────────────────────────────────

export class TradeEscrowManager {
  private escrows: Map<string, TradeEscrow> = new Map();

  createEscrow(fromUserId: string, toUserId: string, fromItems: EscrowItem[], toItems: EscrowItem[], fromNexo = 0, toNexo = 0): TradeEscrow {
    const escrow: TradeEscrow = {
      id: `escrow_${Date.now()}`,
      fromUserId,
      toUserId,
      fromItems,
      toItems,
      fromNexo,
      toNexo,
      status: 'pending_both',
      fromConfirmed: false,
      toConfirmed: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    };
    this.escrows.set(escrow.id, escrow);
    return escrow;
  }

  confirmEscrow(escrowId: string, userId: string): TradeEscrow | null {
    const escrow = this.escrows.get(escrowId);
    if (!escrow || escrow.status !== 'pending_both') return null;

    if (userId === escrow.fromUserId) escrow.fromConfirmed = true;
    else if (userId === escrow.toUserId) escrow.toConfirmed = true;
    else return null;

    if (escrow.fromConfirmed && escrow.toConfirmed) {
      escrow.status = 'completed';
      // Here: execute actual transfer logic
    } else {
      escrow.status = 'pending_other';
    }
    return escrow;
  }

  cancelEscrow(escrowId: string, userId: string): TradeEscrow | null {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) return null;
    if (userId !== escrow.fromUserId && userId !== escrow.toUserId) return null;
    escrow.status = 'cancelled';
    return escrow;
  }

  getEscrowForUser(userId: string): TradeEscrow[] {
    return Array.from(this.escrows.values()).filter(e => 
      (e.fromUserId === userId || e.toUserId === userId) && e.status !== 'completed' && e.status !== 'cancelled'
    );
  }
}
