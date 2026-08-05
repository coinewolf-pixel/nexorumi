export function calculateMatchScore(p1, p2) {
  const eloDiff = Math.abs(p1.elo - p2.elo);
  const latencyDiff = Math.abs((p1.latency || 50) - (p2.latency || 50));
  const eloScore = Math.max(0, 100 - eloDiff / 20);
  const latencyScore = Math.max(0, 100 - latencyDiff);
  return (eloScore * 0.7 + latencyScore * 0.3);
}
