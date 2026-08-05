// =====================================================
// ML MATCHMAKING SERVICE
// 6 Features: ELO, Latency, Playstyle, Toxicity, Role, Activity
// Weighted Euclidean Distance + Online Learning + K-Means
// =====================================================

import type { MatchmakingProfile } from '../types';

// Feature weights (tuneable)
const WEIGHTS = {
  elo: 0.30,
  latency: 0.20,
  playstyle: 0.20,
  toxicity: 0.15,
  role: 0.10,
  activity: 0.05,
};

// Normalize features to 0-1 range
function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Calculate weighted Euclidean distance between two players
export function calculateDistance(a: MatchmakingProfile, b: MatchmakingProfile): number {
  const eloDiff = normalize(Math.abs(a.elo - b.elo), 0, 2000);
  const latencyDiff = normalize(Math.abs(a.latency - b.latency), 0, 300);

  // Playstyle cosine similarity (convert to distance)
  const playstyleSim = cosineSimilarity(a.playstyle, b.playstyle);
  const playstyleDiff = 1 - playstyleSim;

  const toxicityDiff = normalize(Math.abs(a.toxicity_score - b.toxicity_score), 0, 100);
  const roleDiff = a.preferred_role === b.preferred_role ? 0 : 1;
  const activityDiff = normalize(Math.abs(a.activity_score - b.activity_score), 0, 100);

  return Math.sqrt(
    WEIGHTS.elo * eloDiff * eloDiff +
    WEIGHTS.latency * latencyDiff * latencyDiff +
    WEIGHTS.playstyle * playstyleDiff * playstyleDiff +
    WEIGHTS.toxicity * toxicityDiff * toxicityDiff +
    WEIGHTS.role * roleDiff * roleDiff +
    WEIGHTS.activity * activityDiff * activityDiff
  );
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-10);
}

// Find best match for a player from a pool
export function findBestMatch(
  player: MatchmakingProfile,
  pool: MatchmakingProfile[],
  maxDistance: number = 0.3
): MatchmakingProfile | null {
  let bestMatch: MatchmakingProfile | null = null;
  let bestDistance = Infinity;

  for (const candidate of pool) {
    if (candidate.user_id === player.user_id) continue;

    const distance = calculateDistance(player, candidate);
    if (distance < bestDistance && distance <= maxDistance) {
      bestDistance = distance;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

// Predict team compatibility (0-1 score)
export function predictTeamCompatibility(team: MatchmakingProfile[]): number {
  if (team.length < 2) return 1.0;

  let totalCompatibility = 0;
  let pairs = 0;

  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      const distance = calculateDistance(team[i], team[j]);
      totalCompatibility += 1 - distance;
      pairs++;
    }
  }

  return totalCompatibility / pairs;
}

// K-Means clustering for player segmentation
export function kMeansCluster(players: MatchmakingProfile[], k: number = 4): Map<number, MatchmakingProfile[]> {
  // Simplified k-means using ELO as primary feature
  const sorted = [...players].sort((a, b) => a.elo - b.elo);
  const clusters = new Map<number, MatchmakingProfile[]>();
  const clusterSize = Math.ceil(sorted.length / k);

  for (let i = 0; i < k; i++) {
    const start = i * clusterSize;
    const end = Math.min(start + clusterSize, sorted.length);
    clusters.set(i, sorted.slice(start, end));
  }

  return clusters;
}

// Online learning: update weights based on match outcome
export function updateWeights(matchQuality: number, targetQuality: number = 0.8): void {
  const learningRate = 0.01;
  const error = targetQuality - matchQuality;

  // Adjust weights (simplified - in production use gradient descent)
  if (error > 0) {
    // Increase weight on features that led to good matches
    WEIGHTS.elo += learningRate * error;
  } else {
    WEIGHTS.elo -= learningRate * Math.abs(error);
  }

  // Normalize weights
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>) {
    WEIGHTS[key] /= total;
  }
}

// Create balanced teams from a pool
export function createBalancedTeams(
  pool: MatchmakingProfile[],
  teamSize: number = 5
): { teamA: MatchmakingProfile[]; teamB: MatchmakingProfile[]; quality: number } {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const teamA: MatchmakingProfile[] = [];
  const teamB: MatchmakingProfile[] = [];

  // Sort by ELO and distribute alternately for balance
  const sorted = shuffled.sort((a, b) => b.elo - a.elo);

  for (let i = 0; i < sorted.length && (teamA.length < teamSize || teamB.length < teamSize); i++) {
    const avgA = teamA.reduce((s, p) => s + p.elo, 0) / (teamA.length || 1);
    const avgB = teamB.reduce((s, p) => s + p.elo, 0) / (teamB.length || 1);

    if (teamA.length < teamSize && (teamA.length <= teamB.length || avgA <= avgB)) {
      teamA.push(sorted[i]);
    } else if (teamB.length < teamSize) {
      teamB.push(sorted[i]);
    }
  }

  const quality = predictTeamCompatibility([...teamA, ...teamB]);

  return { teamA, teamB, quality };
}
