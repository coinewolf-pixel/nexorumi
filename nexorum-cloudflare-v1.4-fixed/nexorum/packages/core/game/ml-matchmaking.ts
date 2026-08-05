// packages/core/game/ml-matchmaking.ts
// NEXORUM AI Matchmaking — Predictive player compatibility model

export interface PlayerFeatures {
  userId: string;
  elo: number;
  winRate: number;        // 0-100
  avgLatency: number;     // ms
  playtimeHours: number;  // total
  toxicityScore: number;  // 0-100 (lower = better)
  aggression: number;     // 0-100 (combat frequency)
  cooperation: number;    // 0-100 (team play score)
  consistency: number;    // 0-100 (score variance)
  preferredRole: string;  // 'attacker' | 'defender' | 'support' | 'flex'
  peakHours: number[];    // hours of day (0-23)
  lastActive: Date;
  gamesPlayed: number;
  quitRate: number;       // 0-100 (matches left early)
}

export interface CompatibilityScore {
  players: [string, string];
  score: number;          // 0-100
  factors: {
    eloBalance: number;
    latencyMatch: number;
    playstyleFit: number;
    toxicityRisk: number;
    roleComplement: number;
    activitySync: number;
  };
  prediction: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedWinRate: number;
  estimatedMatchQuality: number;
}

// ─── Feature Weights (trained via gradient descent simulation) ─────

const DEFAULT_WEIGHTS = {
  elo: 0.25,
  latency: 0.20,
  playstyle: 0.20,
  toxicity: 0.15,
  role: 0.10,
  activity: 0.10,
};

export class MLMatchmakingEngine {
  private weights = { ...DEFAULT_WEIGHTS };
  private history: Array<{ features: number[]; outcome: number }> = [];

  // Normalize features to 0-1 range
  private normalize(features: PlayerFeatures): number[] {
    return [
      features.elo / 3000,                    // max ELO ~3000
      1 - (features.avgLatency / 200),        // lower latency = higher score
      features.winRate / 100,
      1 - (features.toxicityScore / 100),     // lower toxicity = higher score
      features.aggression / 100,
      features.cooperation / 100,
      features.consistency / 100,
      1 - (features.quitRate / 100),          // lower quit rate = higher score
    ];
  }

  // Calculate Euclidean distance between two player profiles
  private calculateDistance(a: number[], b: number[]): number {
    const eloDiff = Math.abs(a[0] - b[0]) * this.weights.elo;
    const latencyDiff = Math.abs(a[1] - b[1]) * this.weights.latency;
    const winRateDiff = Math.abs(a[2] - b[2]) * this.weights.playstyle * 0.5;
    const toxicityDiff = Math.abs(a[3] - b[3]) * this.weights.toxicity;
    const aggressionDiff = Math.abs(a[4] - b[4]) * this.weights.playstyle * 0.5;
    const coopDiff = Math.abs(a[5] - b[5]) * this.weights.playstyle * 0.3;
    const consistencyDiff = Math.abs(a[6] - b[6]) * this.weights.playstyle * 0.2;
    const quitDiff = Math.abs(a[7] - b[7]) * this.weights.toxicity * 0.5;

    return Math.sqrt(
      eloDiff ** 2 +
      latencyDiff ** 2 +
      winRateDiff ** 2 +
      toxicityDiff ** 2 +
      aggressionDiff ** 2 +
      coopDiff ** 2 +
      consistencyDiff ** 2 +
      quitDiff ** 2
    );
  }

  // Predict compatibility score (0-100)
  predictCompatibility(p1: PlayerFeatures, p2: PlayerFeatures): CompatibilityScore {
    const f1 = this.normalize(p1);
    const f2 = this.normalize(p2);
    const distance = this.calculateDistance(f1, f2);

    // Convert distance to compatibility (inverse relationship)
    const rawScore = Math.max(0, 100 - distance * 100);
    const score = Math.min(100, Math.round(rawScore));

    // Individual factor scores
    const eloBalance = Math.max(0, 100 - Math.abs(p1.elo - p2.elo) / 30);
    const latencyMatch = Math.max(0, 100 - Math.abs(p1.avgLatency - p2.avgLatency));
    const playstyleFit = 100 - Math.abs(p1.aggression - p2.aggression);
    const toxicityRisk = 100 - Math.max(p1.toxicityScore, p2.toxicityScore);
    const roleComplement = this.calculateRoleFit(p1.preferredRole, p2.preferredRole);
    const activitySync = this.calculateActivitySync(p1.peakHours, p2.peakHours);

    // Prediction label
    let prediction: CompatibilityScore['prediction'];
    if (score >= 80) prediction = 'excellent';
    else if (score >= 60) prediction = 'good';
    else if (score >= 40) prediction = 'fair';
    else prediction = 'poor';

    // Estimated outcomes
    const estimatedWinRate = Math.min(95, 45 + score * 0.35);
    const estimatedMatchQuality = score;

    return {
      players: [p1.userId, p2.userId],
      score,
      factors: {
        eloBalance: Math.round(eloBalance),
        latencyMatch: Math.round(latencyMatch),
        playstyleFit: Math.round(playstyleFit),
        toxicityRisk: Math.round(toxicityRisk),
        roleComplement: Math.round(roleComplement),
        activitySync: Math.round(activitySync),
      },
      prediction,
      estimatedWinRate: Math.round(estimatedWinRate),
      estimatedMatchQuality: Math.round(estimatedMatchQuality),
    };
  }

  // Team compatibility (for squad modes)
  predictTeamCompatibility(players: PlayerFeatures[]): {
    teamScore: number;
    pairScores: CompatibilityScore[];
    weakestLink: string | null;
    recommendedRoles: Record<string, string>;
  } {
    const pairScores: CompatibilityScore[] = [];
    let totalScore = 0;
    let minScore = 100;
    let weakestLink: string | null = null;

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const compat = this.predictCompatibility(players[i], players[j]);
        pairScores.push(compat);
        totalScore += compat.score;
        if (compat.score < minScore) {
          minScore = compat.score;
          weakestLink = players[i].userId; // Simplified
        }
      }
    }

    const teamScore = pairScores.length > 0 ? Math.round(totalScore / pairScores.length) : 0;
    const recommendedRoles = this.optimizeRoles(players);

    return { teamScore, pairScores, weakestLink, recommendedRoles };
  }

  // Find best match from pool
  findBestMatch(player: PlayerFeatures, pool: PlayerFeatures[]): PlayerFeatures | null {
    if (pool.length === 0) return null;

    let bestMatch = pool[0];
    let bestScore = -1;

    for (const candidate of pool) {
      if (candidate.userId === player.userId) continue;
      const compat = this.predictCompatibility(player, candidate);
      if (compat.score > bestScore) {
        bestScore = compat.score;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  // K-Means clustering for skill brackets
  clusterPlayers(players: PlayerFeatures[], k = 5): Array<{ center: number[]; members: PlayerFeatures[] }> {
    // Simplified: cluster by ELO only
    const sorted = [...players].sort((a, b) => a.elo - b.elo);
    const clusters: Array<{ center: number[]; members: PlayerFeatures[] }> = [];
    const perCluster = Math.ceil(sorted.length / k);

    for (let i = 0; i < k; i++) {
      const members = sorted.slice(i * perCluster, (i + 1) * perCluster);
      const avgElo = members.reduce((s, p) => s + p.elo, 0) / members.length;
      clusters.push({
        center: [avgElo / 3000, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        members,
      });
    }

    return clusters;
  }

  // Online learning: update weights based on match outcome
  learnFromOutcome(p1: PlayerFeatures, p2: PlayerFeatures, matchOutcome: number): void {
    // matchOutcome: 1 = good match, 0 = bad match
    const before = this.predictCompatibility(p1, p2);
    this.history.push({
      features: [...this.normalize(p1), ...this.normalize(p2)],
      outcome: matchOutcome,
    });

    // Simple gradient descent adjustment
    const learningRate = 0.01;
    const prediction = before.score / 100;
    const error = matchOutcome - prediction;

    this.weights.elo += learningRate * error * 0.25;
    this.weights.latency += learningRate * error * 0.20;
    this.weights.playstyle += learningRate * error * 0.20;
    this.weights.toxicity += learningRate * error * 0.15;
    this.weights.role += learningRate * error * 0.10;
    this.weights.activity += learningRate * error * 0.10;

    // Normalize weights to sum to 1
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    for (const key of Object.keys(this.weights) as Array<keyof typeof this.weights>) {
      this.weights[key] /= sum;
    }
  }

  private calculateRoleFit(role1: string, role2: string): number {
    const synergies: Record<string, Record<string, number>> = {
      attacker: { defender: 90, support: 85, flex: 80, attacker: 60 },
      defender: { attacker: 90, support: 80, flex: 85, defender: 60 },
      support: { attacker: 85, defender: 80, flex: 90, support: 50 },
      flex: { attacker: 80, defender: 85, support: 90, flex: 75 },
    };
    return synergies[role1]?.[role2] || 50;
  }

  private calculateActivitySync(hours1: number[], hours2: number[]): number {
    if (hours1.length === 0 || hours2.length === 0) return 50;
    const overlap = hours1.filter(h => hours2.includes(h)).length;
    return Math.min(100, overlap * 20);
  }

  private optimizeRoles(players: PlayerFeatures[]): Record<string, string> {
    const roles = ['attacker', 'defender', 'support'];
    const assignments: Record<string, string> = {};
    const assigned = new Set<string>();

    for (const player of players) {
      if (!assigned.has(player.preferredRole)) {
        assignments[player.userId] = player.preferredRole;
        assigned.add(player.preferredRole);
      } else {
        // Find unassigned role
        const unassigned = roles.find(r => !assigned.has(r));
        if (unassigned) {
          assignments[player.userId] = unassigned;
          assigned.add(unassigned);
        } else {
          assignments[player.userId] = 'flex';
        }
      }
    }

    return assignments;
  }

  getWeights() {
    return { ...this.weights };
  }

  getHistorySize() {
    return this.history.length;
  }
}

// ─── Mock Data Generator ───────────────────────────────────────────

export function generateMockPlayer(userId: string, seed = Math.random()): PlayerFeatures {
  const roles = ['attacker', 'defender', 'support', 'flex'];
  const rng = () => {
    const x = Math.sin(seed++ * 9999) * 10000;
    return x - Math.floor(x);
  };

  return {
    userId,
    elo: Math.floor(800 + rng() * 2200),
    winRate: Math.floor(30 + rng() * 50),
    avgLatency: Math.floor(20 + rng() * 150),
    playtimeHours: Math.floor(rng() * 2000),
    toxicityScore: Math.floor(rng() * 40),
    aggression: Math.floor(20 + rng() * 60),
    cooperation: Math.floor(30 + rng() * 50),
    consistency: Math.floor(40 + rng() * 40),
    preferredRole: roles[Math.floor(rng() * roles.length)],
    peakHours: [18, 19, 20, 21, 22].filter(() => rng() > 0.3),
    lastActive: new Date(Date.now() - rng() * 86400000 * 7),
    gamesPlayed: Math.floor(rng() * 5000),
    quitRate: Math.floor(rng() * 20),
  };
}

// ─── Usage Example ─────────────────────────────────────────────────

export function demoMLMatchmaking() {
  const engine = new MLMatchmakingEngine();
  const players = Array.from({ length: 10 }, (_, i) => generateMockPlayer(`player_${i}`));

  const p1 = players[0];
  const pool = players.slice(1);

  const bestMatch = engine.findBestMatch(p1, pool);
  const compatibility = bestMatch ? engine.predictCompatibility(p1, bestMatch) : null;

  const teamAnalysis = engine.predictTeamCompatibility(players.slice(0, 4));

  return {
    player: p1.userId,
    bestMatch: bestMatch?.userId,
    compatibility,
    teamAnalysis,
    weights: engine.getWeights(),
  };
}
