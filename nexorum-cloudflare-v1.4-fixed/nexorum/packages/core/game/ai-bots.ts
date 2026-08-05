// packages/core/game/ai-bots.ts
// NEXORUM AI Bots — Smart NPCs that fill matches with realistic behavior

export interface AIBotConfig {
  difficulty: 'easy' | 'normal' | 'hard' | 'expert' | 'legendary';
  personality: 'aggressive' | 'defensive' | 'balanced' | 'opportunist' | 'teamplayer';
  reactionTime: number;      // ms (200-800)
  accuracy: number;          // 0-100
  decisionSpeed: number;     // 0-100
  adaptability: number;      // 0-100
  riskTolerance: number;     // 0-100
  communication: number;     // 0-100 (chat frequency)
}

export interface BotState {
  userId: string;
  username: string;
  position: { x: number; y: number; z: number };
  health: number;
  ammo: number;
  score: number;
  targetId?: string;
  lastAction: string;
  actionCooldown: number;
  behaviorTree: string;
}

export interface GameContext {
  matchId: string;
  marketId: string;
  mode: string;
  mapId: string;
  elapsedTime: number;
  players: Array<{ userId: string; position: { x: number; y: number; z: number }; health: number; team: number }>;
  items: Array<{ id: string; position: { x: number; y: number; z: number }; type: string }>;
  zones: Array<{ center: { x: number; y: number; z: number }; radius: number; type: string }>;
}

// ─── Difficulty Presets ────────────────────────────────────────────

export const BOT_PRESETS: Record<string, AIBotConfig> = {
  easy: {
    difficulty: 'easy',
    personality: 'balanced',
    reactionTime: 600,
    accuracy: 30,
    decisionSpeed: 20,
    adaptability: 10,
    riskTolerance: 30,
    communication: 10,
  },
  normal: {
    difficulty: 'normal',
    personality: 'balanced',
    reactionTime: 400,
    accuracy: 55,
    decisionSpeed: 50,
    adaptability: 40,
    riskTolerance: 50,
    communication: 30,
  },
  hard: {
    difficulty: 'hard',
    personality: 'aggressive',
    reactionTime: 250,
    accuracy: 75,
    decisionSpeed: 75,
    adaptability: 70,
    riskTolerance: 70,
    communication: 50,
  },
  expert: {
    difficulty: 'expert',
    personality: 'opportunist',
    reactionTime: 180,
    accuracy: 90,
    decisionSpeed: 90,
    adaptability: 90,
    riskTolerance: 85,
    communication: 70,
  },
  legendary: {
    difficulty: 'legendary',
    personality: 'opportunist',
    reactionTime: 150,
    accuracy: 98,
    decisionSpeed: 95,
    adaptability: 95,
    riskTolerance: 90,
    communication: 90,
  },
};

// ─── Bot Names ─────────────────────────────────────────────────────

const BOT_NAMES = [
  'Nova', 'Viper', 'Phantom', 'Raven', 'Wraith', 'Spectre', 'Ghost', 'Reaper',
  'Shadow', 'Blaze', 'Frost', 'Storm', 'Thunder', 'Venom', 'Cobra', 'Wolf',
  'Hawk', 'Eagle', 'Falcon', 'Tiger', 'Lion', 'Bear', 'Shark', 'Dragon',
  'Cipher', 'Glitch', 'Proxy', 'Daemon', 'Vector', 'Matrix', 'Neon', 'Pulse',
  'Spark', 'Bolt', 'Flash', 'Surge', 'Ripple', 'Wave', 'Echo', 'Zenith',
];

// ─── AI Bot Engine ─────────────────────────────────────────────────

export class AIBotEngine {
  private bots: Map<string, BotState> = new Map();
  private configs: Map<string, AIBotConfig> = new Map();
  private tickRate = 1000 / 10; // 10 Hz decision making
  private interval: any = null;

  createBot(difficulty: string = 'normal', team: number = 0): { state: BotState; config: AIBotConfig } {
    const config = { ...BOT_PRESETS[difficulty] || BOT_PRESETS.normal };
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + '_' + Math.floor(Math.random() * 999);

    const state: BotState = {
      userId: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      username: name,
      position: { x: Math.random() * 100, y: 0, z: Math.random() * 100 },
      health: 100,
      ammo: 100,
      score: 0,
      lastAction: 'idle',
      actionCooldown: 0,
      behaviorTree: 'explore',
    };

    this.bots.set(state.userId, state);
    this.configs.set(state.userId, config);

    return { state, config };
  }

  startGameLoop(context: GameContext): void {
    if (this.interval) return;

    this.interval = setInterval(() => {
      this.tick(context);
    }, this.tickRate);
  }

  stopGameLoop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private tick(context: GameContext): void {
    this.bots.forEach((bot, userId) => {
      const config = this.configs.get(userId)!;

      if (bot.actionCooldown > 0) {
        bot.actionCooldown -= this.tickRate;
        return;
      }

      const action = this.decideAction(bot, config, context);
      this.executeAction(bot, action, context);

      // Random communication
      if (Math.random() * 100 < config.communication && config.communication > 0) {
        this.generateChat(bot, config, context);
      }
    });
  }

  private decideAction(bot: BotState, config: AIBotConfig, context: GameContext): string {
    const enemies = this.getEnemies(bot, context);
    const nearbyItems = this.getNearbyItems(bot, context);
    const dangerLevel = this.assessDanger(bot, context);

    // Health check — retreat if low
    if (bot.health < 30 && config.riskTolerance < 80) {
      return 'retreat';
    }

    // Ammo check — find ammo if low
    if (bot.ammo < 20 && nearbyItems.some(i => i.type === 'ammo')) {
      return 'collect_ammo';
    }

    // Combat decision
    if (enemies.length > 0) {
      const closest = enemies[0];
      const distance = this.getDistance(bot.position, closest.position);

      if (distance < 50 && config.accuracy > 60) {
        bot.targetId = closest.userId;
        return 'attack';
      }

      if (config.personality === 'aggressive' || (config.personality === 'opportunist' && bot.health > 50)) {
        bot.targetId = closest.userId;
        return 'chase';
      }

      if (config.personality === 'defensive' || bot.health < 50) {
        return 'take_cover';
      }
    }

    // Explore or collect
    if (nearbyItems.length > 0 && config.riskTolerance > 40) {
      return 'collect_item';
    }

    // Zone movement (for battle royale modes)
    const safeZone = context.zones.find(z => z.type === 'safe');
    if (safeZone && this.getDistance(bot.position, safeZone.center) > safeZone.radius * 0.8) {
      return 'move_to_zone';
    }

    return 'explore';
  }

  private executeAction(bot: BotState, action: string, context: GameContext): void {
    const config = this.configs.get(bot.userId)!;
    bot.lastAction = action;

    switch (action) {
      case 'attack':
        if (bot.targetId) {
          const target = context.players.find(p => p.userId === bot.targetId);
          if (target) {
            // Simulate shot with accuracy factor
            const hitChance = config.accuracy / 100 * (1 - this.getDistance(bot.position, target.position) / 200);
            if (Math.random() < hitChance) {
              bot.score += 10;
            }
            bot.ammo = Math.max(0, bot.ammo - 1);
          }
        }
        bot.actionCooldown = config.reactionTime;
        break;

      case 'chase':
        if (bot.targetId) {
          const target = context.players.find(p => p.userId === bot.targetId);
          if (target) {
            this.moveTowards(bot, target.position, config.decisionSpeed);
          }
        }
        bot.actionCooldown = 500;
        break;

      case 'retreat':
        const safeSpot = this.findSafeSpot(bot, context);
        this.moveTowards(bot, safeSpot, config.decisionSpeed * 1.5);
        bot.actionCooldown = 800;
        break;

      case 'take_cover':
        bot.actionCooldown = 1000;
        break;

      case 'collect_ammo':
      case 'collect_item':
        const items = this.getNearbyItems(bot, context);
        if (items.length > 0) {
          this.moveTowards(bot, items[0].position, config.decisionSpeed);
          if (this.getDistance(bot.position, items[0].position) < 5) {
            bot.ammo = Math.min(100, bot.ammo + 30);
          }
        }
        bot.actionCooldown = 600;
        break;

      case 'move_to_zone':
        const zone = context.zones.find(z => z.type === 'safe');
        if (zone) this.moveTowards(bot, zone.center, config.decisionSpeed);
        bot.actionCooldown = 1000;
        break;

      case 'explore':
        this.randomMove(bot, config.decisionSpeed);
        bot.actionCooldown = 1500;
        break;
    }
  }

  private generateChat(bot: BotState, config: AIBotConfig, context: GameContext): string {
    const messages: Record<string, string[]> = {
      aggressive: ['Target spotted!', 'Engaging!', 'No escape!', 'You're mine!'],
      defensive: ['Taking cover!', 'Need backup!', 'Healing up!', 'Watch my back!'],
      balanced: ['Moving in', 'Clear here', 'Contact ahead', 'Roger that'],
      opportunist: ['Easy pickings', 'Got one!', 'Loot here', 'Quick strike'],
      teamplayer: ['On your six', 'Covering you', 'Nice shot!', 'Group up!'],
    };

    const pool = messages[config.personality] || messages.balanced;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private getEnemies(bot: BotState, context: GameContext): Array<{ userId: string; position: { x: number; y: number; z: number } }> {
    const botTeam = context.players.find(p => p.userId === bot.userId)?.team || 0;
    return context.players
      .filter(p => p.userId !== bot.userId && p.team !== botTeam && p.health > 0)
      .map(p => ({ userId: p.userId, position: p.position }))
      .sort((a, b) => this.getDistance(bot.position, a.position) - this.getDistance(bot.position, b.position));
  }

  private getNearbyItems(bot: BotState, context: GameContext): Array<{ id: string; position: { x: number; y: number; z: number }; type: string }> {
    return context.items
      .filter(i => this.getDistance(bot.position, i.position) < 50)
      .sort((a, b) => this.getDistance(bot.position, a.position) - this.getDistance(bot.position, b.position));
  }

  private assessDanger(bot: BotState, context: GameContext): number {
    const enemies = this.getEnemies(bot, context);
    if (enemies.length === 0) return 0;
    const closest = this.getDistance(bot.position, enemies[0].position);
    return Math.max(0, 100 - closest);
  }

  private getDistance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
  }

  private moveTowards(bot: BotState, target: { x: number; y: number; z: number }, speed: number): void {
    const dx = target.x - bot.position.x;
    const dz = target.z - bot.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0) {
      const moveSpeed = speed / 100 * 10;
      bot.position.x += (dx / dist) * moveSpeed;
      bot.position.z += (dz / dist) * moveSpeed;
    }
  }

  private randomMove(bot: BotState, speed: number): void {
    const angle = Math.random() * Math.PI * 2;
    const moveSpeed = speed / 100 * 5;
    bot.position.x += Math.cos(angle) * moveSpeed;
    bot.position.z += Math.sin(angle) * moveSpeed;
  }

  private findSafeSpot(bot: BotState, context: GameContext): { x: number; y: number; z: number } {
    const safeZone = context.zones.find(z => z.type === 'safe');
    if (safeZone) return safeZone.center;
    return { x: bot.position.x + (Math.random() - 0.5) * 50, y: 0, z: bot.position.z + (Math.random() - 0.5) * 50 };
  }

  getBotState(userId: string): BotState | undefined {
    return this.bots.get(userId);
  }

  getAllBots(): BotState[] {
    return Array.from(this.bots.values());
  }

  removeBot(userId: string): void {
    this.bots.delete(userId);
    this.configs.delete(userId);
  }

  getBotCount(): number {
    return this.bots.size;
  }
}

// ─── Bot Integration with MatchRoom DO ─────────────────────────────

export function generateBotsForMatch(count: number, difficulty: string = 'normal'): Array<{ state: BotState; config: AIBotConfig }> {
  const engine = new AIBotEngine();
  const bots: Array<{ state: BotState; config: AIBotConfig }> = [];

  for (let i = 0; i < count; i++) {
    const bot = engine.createBot(difficulty, i % 2); // Alternate teams
    bots.push(bot);
  }

  return bots;
}
