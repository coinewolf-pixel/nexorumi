// apps/api/src/bots/ai-bots.ts
// NEXORUM AI Bot Players — Behavior Trees + ML Decision Making

export interface BotProfile {
  id: string;
  name: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'expert' | 'legendary';
  personality: 'aggressive' | 'defensive' | 'balanced' | 'supportive' | 'unpredictable';
  elo: number;
  reactionTime: number; // ms
  accuracy: number; // 0-100
  decisionSpeed: number; // actions per second
  adaptability: number; // 0-100 (learns from player patterns)
  riskTolerance: number; // 0-100
}

export interface BotState {
  position: { x: number; y: number; z: number };
  health: number;
  ammo: number;
  targetId: string | null;
  lastAction: string;
  actionHistory: string[];
  threatLevel: number; // 0-100
  objectivePriority: number; // 0-100
}

export interface GameContext {
  mapId: string;
  mode: string;
  timeRemaining: number;
  teamScore: number;
  enemyScore: number;
  teammates: Array<{ id: string; position: { x: number; y: number; z: number }; health: number }>;
  enemies: Array<{ id: string; position: { x: number; y: number; z: number }; health: number; lastSeen: number }>;
  objectives: Array<{ id: string; position: { x: number; y: number; z: number }; type: string; captured: boolean }>;
  items: Array<{ id: string; position: { x: number; y: number; z: number }; type: string }>;
}

// ─── Behavior Tree Nodes ───────────────────────────────────────────

interface BTNode {
  execute(bot: AIBot, context: GameContext): BTStatus;
}

type BTStatus = 'success' | 'failure' | 'running';

class SequenceNode implements BTNode {
  constructor(private children: BTNode[]) {}
  execute(bot: AIBot, context: GameContext): BTStatus {
    for (const child of this.children) {
      const status = child.execute(bot, context);
      if (status !== 'success') return status;
    }
    return 'success';
  }
}

class SelectorNode implements BTNode {
  constructor(private children: BTNode[]) {}
  execute(bot: AIBot, context: GameContext): BTStatus {
    for (const child of this.children) {
      const status = child.execute(bot, context);
      if (status !== 'failure') return status;
    }
    return 'failure';
  }
}

class ConditionNode implements BTNode {
  constructor(private condition: (bot: AIBot, ctx: GameContext) => boolean) {}
  execute(bot: AIBot, context: GameContext): BTStatus {
    return this.condition(bot, context) ? 'success' : 'failure';
  }
}

class ActionNode implements BTNode {
  constructor(private action: (bot: AIBot, ctx: GameContext) => void) {}
  execute(bot: AIBot, context: GameContext): BTStatus {
    this.action(bot, context);
    return 'success';
  }
}

// ─── AI Bot Class ──────────────────────────────────────────────────

export class AIBot {
  profile: BotProfile;
  state: BotState;
  behaviorTree: BTNode;
  private learningMemory: Map<string, number> = new Map(); // playerId -> prediction score
  private patternHistory: string[] = [];

  constructor(profile: BotProfile) {
    this.profile = profile;
    this.state = {
      position: { x: 0, y: 0, z: 0 },
      health: 100,
      ammo: 100,
      targetId: null,
      lastAction: 'idle',
      actionHistory: [],
      threatLevel: 0,
      objectivePriority: 50,
    };
    this.behaviorTree = this.buildBehaviorTree();
  }

  private buildBehaviorTree(): BTNode {
    const personality = this.profile.personality;

    // Root selector: survival first, then objectives, then combat
    return new SelectorNode([
      // Survival branch
      new SequenceNode([
        new ConditionNode((bot) => bot.state.health < 30),
        new ActionNode((bot, ctx) => bot.flee(ctx)),
      ]),

      // Combat branch (varies by personality)
      new SequenceNode([
        new ConditionNode((bot, ctx) => this.shouldEngage(bot, ctx)),
        new SelectorNode([
          new SequenceNode([
            new ConditionNode(() => personality === 'aggressive' || personality === 'unpredictable'),
            new ActionNode((bot, ctx) => bot.attack(ctx)),
          ]),
          new SequenceNode([
            new ConditionNode(() => personality === 'defensive'),
            new ActionNode((bot, ctx) => bot.takeCover(ctx)),
          ]),
          new SequenceNode([
            new ConditionNode(() => personality === 'supportive'),
            new ActionNode((bot, ctx) => bot.supportTeammate(ctx)),
          ]),
          new ActionNode((bot, ctx) => bot.attack(ctx)), // default
        ]),
      ]),

      // Objective branch
      new SequenceNode([
        new ConditionNode((bot) => bot.state.objectivePriority > 50),
        new ActionNode((bot, ctx) => bot.moveToObjective(ctx)),
      ]),

      // Loot branch
      new SequenceNode([
        new ConditionNode((bot) => bot.state.ammo < 30 || bot.state.health < 80),
        new ActionNode((bot, ctx) => bot.seekLoot(ctx)),
      ]),

      // Patrol
      new ActionNode((bot, ctx) => bot.patrol(ctx)),
    ]);
  }

  tick(context: GameContext): { action: string; target?: string; direction?: { x: number; y: number; z: number } } {
    // Update threat level
    this.updateThreatLevel(context);

    // Run behavior tree
    this.behaviorTree.execute(this, context);

    // ML: Learn from enemy patterns
    this.learnFromEnemies(context);

    // Predict enemy moves
    if (this.state.targetId) {
      const prediction = this.predictEnemyMove(this.state.targetId, context);
      if (prediction) {
        return { action: this.state.lastAction, target: this.state.targetId, direction: prediction };
      }
    }

    return { action: this.state.lastAction, target: this.state.targetId || undefined };
  }

  // ─── Actions ─────────────────────────────────────────────────────

  attack(context: GameContext): void {
    const target = this.selectTarget(context);
    if (target) {
      this.state.targetId = target.id;
      this.state.lastAction = 'attack';

      // Adjust accuracy based on difficulty
      const hitChance = this.profile.accuracy / 100;
      const roll = Math.random();

      if (roll < hitChance) {
        // Hit
      } else {
        // Miss — spray pattern based on difficulty
      }
    }
  }

  flee(context: GameContext): void {
    this.state.lastAction = 'flee';
    // Move away from nearest enemy
    const nearest = this.findNearestEnemy(context);
    if (nearest) {
      const dx = this.state.position.x - nearest.position.x;
      const dz = this.state.position.z - nearest.position.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      this.state.position.x += (dx / len) * 5;
      this.state.position.z += (dz / len) * 5;
    }
  }

  takeCover(context: GameContext): void {
    this.state.lastAction = 'take_cover';
    // Find nearest cover point
  }

  supportTeammate(context: GameContext): void {
    this.state.lastAction = 'support';
    // Move to lowest health teammate
    const weakest = context.teammates.reduce((a, b) => a.health < b.health ? a : b);
    this.moveToward(weakest.position);
  }

  moveToObjective(context: GameContext): void {
    this.state.lastAction = 'objective';
    const obj = context.objectives.find(o => !o.captured);
    if (obj) this.moveToward(obj.position);
  }

  seekLoot(context: GameContext): void {
    this.state.lastAction = 'loot';
    const loot = context.items.find(i => i.type === 'ammo' || i.type === 'health');
    if (loot) this.moveToward(loot.position);
  }

  patrol(context: GameContext): void {
    this.state.lastAction = 'patrol';
    // Random patrol or follow predefined path
  }

  // ─── ML Decision Making ──────────────────────────────────────────

  private shouldEngage(bot: AIBot, context: GameContext): boolean {
    const enemies = context.enemies.filter(e => this.distanceTo(e.position) < 50);
    if (enemies.length === 0) return false;

    const healthRatio = bot.state.health / 100;
    const ammoRatio = bot.state.ammo / 100;
    const enemyCount = enemies.length;
    const allyCount = context.teammates.length;

    // Risk assessment
    const risk = (enemyCount / (allyCount + 1)) * (1 - healthRatio) * (1 - ammoRatio);
    const riskThreshold = 1 - (this.profile.riskTolerance / 100);

    return risk < riskThreshold;
  }

  private learnFromEnemies(context: GameContext): void {
    for (const enemy of context.enemies) {
      const key = `pattern_${enemy.id}`;
      const current = this.learningMemory.get(key) || 0;

      // Simple pattern recognition: does enemy prefer left or right?
      // In real implementation: track movement vectors, timing, ability usage
      this.learningMemory.set(key, current + 1);
    }
  }

  private predictEnemyMove(enemyId: string, context: GameContext): { x: number; y: number; z: number } | null {
    const enemy = context.enemies.find(e => e.id === enemyId);
    if (!enemy) return null;

    const memory = this.learningMemory.get(`pattern_${enemyId}`) || 0;
    const confidence = Math.min(0.9, memory / 100); // Confidence increases with observations

    if (confidence < 0.3) return null; // Not enough data

    // Predict: enemy likely moves toward nearest objective or teammate
    const nearestObj = context.objectives.reduce((a, b) => 
      this.distanceToPoint(enemy.position, a.position) < this.distanceToPoint(enemy.position, b.position) ? a : b
    );

    return nearestObj.position;
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private selectTarget(context: GameContext): typeof context.enemies[0] | null {
    const visible = context.enemies.filter(e => this.distanceTo(e.position) < 100 && e.health > 0);
    if (visible.length === 0) return null;

    // Target selection strategy based on personality
    switch (this.profile.personality) {
      case 'aggressive':
        return visible.reduce((a, b) => a.health < b.health ? a : b); // Weakest
      case 'defensive':
        return visible.reduce((a, b) => this.distanceTo(a.position) < this.distanceTo(b.position) ? a : b); // Nearest
      case 'supportive':
        return visible.find(e => context.teammates.some(t => this.distanceBetween(t.position, e.position) < 20)) || visible[0];
      default:
        return visible[Math.floor(Math.random() * visible.length)];
    }
  }

  private findNearestEnemy(context: GameContext): typeof context.enemies[0] | null {
    return context.enemies.reduce((a, b) => 
      this.distanceTo(a.position) < this.distanceTo(b.position) ? a : b
    , context.enemies[0]);
  }

  private moveToward(target: { x: number; y: number; z: number }): void {
    const dx = target.x - this.state.position.x;
    const dz = target.z - this.state.position.z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const speed = this.getMovementSpeed();
    this.state.position.x += (dx / len) * speed;
    this.state.position.z += (dz / len) * speed;
  }

  private getMovementSpeed(): number {
    const base = 5;
    const difficultyMultiplier: Record<string, number> = {
      easy: 0.7, normal: 0.9, hard: 1.0, expert: 1.1, legendary: 1.2,
    };
    return base * (difficultyMultiplier[this.profile.difficulty] || 1);
  }

  private updateThreatLevel(context: GameContext): void {
    const nearbyEnemies = context.enemies.filter(e => this.distanceTo(e.position) < 30);
    const threat = Math.min(100, nearbyEnemies.length * 25);
    this.state.threatLevel = threat;
  }

  private distanceTo(pos: { x: number; y: number; z: number }): number {
    return this.distanceBetween(this.state.position, pos);
  }

  private distanceBetween(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private distanceToPoint(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    return this.distanceBetween(a, b);
  }
}

// ─── Bot Factory ───────────────────────────────────────────────────

export class BotFactory {
  private names = [
    'ShadowHunter', 'NeonRider', 'DeepSea', 'FarmMaster', 'Survivor99',
    'Phantom', 'Viper', 'Storm', 'Blaze', 'Frost', 'Raven', 'Wolf',
    'CyberNinja', 'IronClad', 'StarDust', 'VoidWalker', 'Nova',
  ];

  createBot(difficulty: BotProfile['difficulty'] = 'normal', personality?: BotProfile['personality']): AIBot {
    const name = this.names[Math.floor(Math.random() * this.names.length)];
    const personalities: BotProfile['personality'][] = ['aggressive', 'defensive', 'balanced', 'supportive', 'unpredictable'];
    const selectedPersonality = personality || personalities[Math.floor(Math.random() * personalities.length)];

    const difficultyStats: Record<string, Partial<BotProfile>> = {
      easy: { elo: 600, reactionTime: 500, accuracy: 40, decisionSpeed: 1, adaptability: 10, riskTolerance: 30 },
      normal: { elo: 1000, reactionTime: 300, accuracy: 60, decisionSpeed: 2, adaptability: 30, riskTolerance: 50 },
      hard: { elo: 1400, reactionTime: 200, accuracy: 75, decisionSpeed: 3, adaptability: 50, riskTolerance: 60 },
      expert: { elo: 1800, reactionTime: 150, accuracy: 85, decisionSpeed: 4, adaptability: 70, riskTolerance: 70 },
      legendary: { elo: 2200, reactionTime: 100, accuracy: 95, decisionSpeed: 5, adaptability: 90, riskTolerance: 80 },
    };

    const stats = difficultyStats[difficulty];

    return new AIBot({
      id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      difficulty,
      personality: selectedPersonality,
      elo: stats.elo!,
      reactionTime: stats.reactionTime!,
      accuracy: stats.accuracy!,
      decisionSpeed: stats.decisionSpeed!,
      adaptability: stats.adaptability!,
      riskTolerance: stats.riskTolerance!,
    });
  }

  createTeam(size: number, avgElo: number): AIBot[] {
    const bots: AIBot[] = [];
    const difficulties: BotProfile['difficulty'][] = ['easy', 'normal', 'hard', 'expert', 'legendary'];

    for (let i = 0; i < size; i++) {
      // Select difficulty based on avgElo
      let diff: BotProfile['difficulty'] = 'normal';
      if (avgElo < 800) diff = 'easy';
      else if (avgElo < 1200) diff = 'normal';
      else if (avgElo < 1600) diff = 'hard';
      else if (avgElo < 2000) diff = 'expert';
      else diff = 'legendary';

      bots.push(this.createBot(diff));
    }

    return bots;
  }
}

// ─── Bot Manager for MatchRoom ─────────────────────────────────────

export class BotManager {
  private bots: Map<string, AIBot> = new Map();
  private factory = new BotFactory();
  private tickInterval: any = null;

  spawnBots(count: number, difficulty: BotProfile['difficulty'], context: any): string[] {
    const botIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const bot = this.factory.createBot(difficulty);
      this.bots.set(bot.profile.id, bot);
      botIds.push(bot.profile.id);
    }
    return botIds;
  }

  startTicking(context: any, onAction: (botId: string, action: any) => void): void {
    this.tickInterval = setInterval(() => {
      this.bots.forEach((bot, id) => {
        const result = bot.tick(context);
        onAction(id, result);
      });
    }, 1000 / 20); // 20 TPS
  }

  removeBot(botId: string): void {
    this.bots.delete(botId);
  }

  stop(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.bots.clear();
  }
}
