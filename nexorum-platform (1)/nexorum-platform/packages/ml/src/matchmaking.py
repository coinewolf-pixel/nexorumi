# =====================================================
# NEXORUM ML MATCHMAKING MODEL
# 6 Features: ELO, Latency, Playstyle, Toxicity, Role, Activity
# Weighted Euclidean Distance + Online Learning + K-Means
# =====================================================

import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from sklearn.cluster import KMeans
import json

@dataclass
class PlayerProfile:
    user_id: str
    elo: float
    latency: float
    playstyle: List[float]
    toxicity_score: float
    preferred_role: str
    activity_score: float
    last_match_at: Optional[str] = None

class MatchmakingEngine:
    def __init__(self):
        self.weights = {
            'elo': 0.30,
            'latency': 0.20,
            'playstyle': 0.20,
            'toxicity': 0.15,
            'role': 0.10,
            'activity': 0.05,
        }
        self.role_map = {'tank': 0, 'damage': 1, 'support': 2, 'flex': 3}
        self.kmeans_model = None

    def normalize(self, value: float, min_val: float, max_val: float) -> float:
        return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))

    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        a_np, b_np = np.array(a), np.array(b)
        dot = np.dot(a_np, b_np)
        mag_a = np.linalg.norm(a_np)
        mag_b = np.linalg.norm(b_np)
        return dot / (mag_a * mag_b + 1e-10)

    def calculate_distance(self, a: PlayerProfile, b: PlayerProfile) -> float:
        elo_diff = self.normalize(abs(a.elo - b.elo), 0, 2000)
        latency_diff = self.normalize(abs(a.latency - b.latency), 0, 300)
        playstyle_sim = self.cosine_similarity(a.playstyle, b.playstyle)
        playstyle_diff = 1.0 - playstyle_sim
        toxicity_diff = self.normalize(abs(a.toxicity_score - b.toxicity_score), 0, 100)
        role_diff = 0.0 if a.preferred_role == b.preferred_role else 1.0
        activity_diff = self.normalize(abs(a.activity_score - b.activity_score), 0, 100)

        return np.sqrt(
            self.weights['elo'] * elo_diff ** 2 +
            self.weights['latency'] * latency_diff ** 2 +
            self.weights['playstyle'] * playstyle_diff ** 2 +
            self.weights['toxicity'] * toxicity_diff ** 2 +
            self.weights['role'] * role_diff ** 2 +
            self.weights['activity'] * activity_diff ** 2
        )

    def find_best_match(self, player: PlayerProfile, pool: List[PlayerProfile], max_distance: float = 0.3) -> Optional[PlayerProfile]:
        best_match = None
        best_distance = float('inf')

        for candidate in pool:
            if candidate.user_id == player.user_id:
                continue
            distance = self.calculate_distance(player, candidate)
            if distance < best_distance and distance <= max_distance:
                best_distance = distance
                best_match = candidate

        return best_match

    def predict_team_compatibility(self, team: List[PlayerProfile]) -> float:
        if len(team) < 2:
            return 1.0

        total_compat = 0.0
        pairs = 0

        for i in range(len(team)):
            for j in range(i + 1, len(team)):
                distance = self.calculate_distance(team[i], team[j])
                total_compat += 1.0 - distance
                pairs += 1

        return total_compat / pairs if pairs > 0 else 1.0

    def kmeans_cluster(self, players: List[PlayerProfile], k: int = 4) -> Dict[int, List[PlayerProfile]]:
        features = np.array([[p.elo, p.latency, p.toxicity_score, p.activity_score] for p in players])

        if len(players) < k:
            return {0: players}

        self.kmeans_model = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = self.kmeans_model.fit_predict(features)

        clusters = {}
        for i, label in enumerate(labels):
            clusters.setdefault(label, []).append(players[i])

        return clusters

    def create_balanced_teams(self, pool: List[PlayerProfile], team_size: int = 5) -> Tuple[List[PlayerProfile], List[PlayerProfile], float]:
        sorted_players = sorted(pool, key=lambda p: p.elo, reverse=True)
        team_a, team_b = [], []

        for player in sorted_players:
            avg_a = sum(p.elo for p in team_a) / len(team_a) if team_a else 0
            avg_b = sum(p.elo for p in team_b) / len(team_b) if team_b else 0

            if len(team_a) < team_size and (len(team_a) <= len(team_b) or avg_a <= avg_b):
                team_a.append(player)
            elif len(team_b) < team_size:
                team_b.append(player)

        quality = self.predict_team_compatibility(team_a + team_b)
        return team_a, team_b, quality

    def update_weights(self, match_quality: float, target_quality: float = 0.8, learning_rate: float = 0.01):
        error = target_quality - match_quality

        if error > 0:
            self.weights['elo'] += learning_rate * error
        else:
            self.weights['elo'] -= learning_rate * abs(error)

        total = sum(self.weights.values())
        for key in self.weights:
            self.weights[key] /= total

    def to_dict(self) -> Dict:
        return {
            'weights': self.weights,
            'kmeans_centers': self.kmeans_model.cluster_centers_.tolist() if self.kmeans_model else None,
        }

# Example usage
if __name__ == '__main__':
    engine = MatchmakingEngine()

    players = [
        PlayerProfile('p1', 1500, 30, [0.8, 0.6, 0.4], 10, 'damage', 85),
        PlayerProfile('p2', 1480, 25, [0.7, 0.7, 0.5], 15, 'tank', 90),
        PlayerProfile('p3', 1520, 35, [0.6, 0.8, 0.3], 5, 'support', 70),
        PlayerProfile('p4', 1450, 20, [0.9, 0.5, 0.6], 20, 'damage', 60),
        PlayerProfile('p5', 1550, 40, [0.5, 0.9, 0.7], 8, 'flex', 95),
        PlayerProfile('p6', 1490, 28, [0.7, 0.6, 0.5], 12, 'tank', 80),
        PlayerProfile('p7', 1510, 32, [0.8, 0.7, 0.4], 7, 'support', 75),
        PlayerProfile('p8', 1470, 22, [0.6, 0.8, 0.6], 18, 'damage', 65),
        PlayerProfile('p9', 1530, 38, [0.5, 0.7, 0.8], 3, 'flex', 88),
        PlayerProfile('p10', 1460, 26, [0.9, 0.4, 0.5], 25, 'tank', 55),
    ]

    # Find best match
    match = engine.find_best_match(players[0], players[1:])
    print(f"Best match for {players[0].user_id}: {match.user_id if match else 'None'}")

    # Create balanced teams
    team_a, team_b, quality = engine.create_balanced_teams(players, 5)
    print(f"\nTeam A: {[p.user_id for p in team_a]}")
    print(f"Team B: {[p.user_id for p in team_b]}")
    print(f"Compatibility: {quality:.2%}")

    # K-means clustering
    clusters = engine.kmeans_cluster(players, 3)
    print(f"\nClusters: {len(clusters)}")
    for cid, members in clusters.items():
        print(f"  Cluster {cid}: {[p.user_id for p in members]}")
