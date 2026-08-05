import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const MARKETS = ['Global', 'Hunt', 'Racing', 'Fishing', 'Farm', 'Survival'];

const LEADERS = [
  { rank: 1, name: 'NexorKing', level: 99, score: 2450000, avatar: '👑' },
  { rank: 2, name: 'ShadowHunter', level: 87, score: 1980000, avatar: '🥈' },
  { rank: 3, name: 'SpeedDemon', level: 82, score: 1760000, avatar: '🥉' },
  { rank: 4, name: 'FarmMaster', level: 78, score: 1540000, avatar: '🌾' },
  { rank: 5, name: 'DeepSea', level: 75, score: 1420000, avatar: '🎣' },
  { rank: 6, name: 'Survivor99', level: 71, score: 1280000, avatar: '⚔️' },
  { rank: 7, name: 'RacerX', level: 69, score: 1150000, avatar: '🏎️' },
  { rank: 8, name: 'Huntress', level: 65, score: 980000, avatar: '🎯' },
  { rank: 9, name: 'CryptoFarmer', level: 62, score: 890000, avatar: '💎' },
  { rank: 10, name: 'You', level: 42, score: 450000, avatar: '⭐', isMe: true },
];

export default function LeaderboardScreen() {
  const [activeMarket, setActiveMarket] = useState('Global');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.marketTabs}>
        {MARKETS.map((m) => (
          <TouchableOpacity key={m} onPress={() => setActiveMarket(m)} style={[styles.marketTab, activeMarket === m && styles.marketTabActive]}>
            <Text style={[styles.marketTabText, activeMarket === m && styles.marketTabTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.leaderList}>
        {LEADERS.map((player) => (
          <View key={player.rank} style={[styles.leaderRow, player.isMe && styles.leaderRowMe]}>
            <Text style={styles.rank}>{player.rank <= 3 ? player.avatar : `#${player.rank}`}</Text>
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, player.isMe && styles.playerNameMe]}>{player.name}</Text>
              <Text style={styles.playerLevel}>Lvl {player.level}</Text>
            </View>
            <Text style={styles.playerScore}>{player.score.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  marketTabs: { flexDirection: 'row', marginBottom: 16 },
  marketTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a1a', marginRight: 8, borderWidth: 1, borderColor: '#333' },
  marketTabActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  marketTabText: { color: '#888', fontSize: 13 },
  marketTabTextActive: { color: '#fff', fontWeight: '600' },
  leaderList: { gap: 4 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#222' },
  leaderRowMe: { backgroundColor: '#6366f115', borderColor: '#6366f1' },
  rank: { width: 40, fontSize: 16, textAlign: 'center' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  playerNameMe: { color: '#6366f1' },
  playerLevel: { fontSize: 11, color: '#666', marginTop: 2 },
  playerScore: { fontSize: 14, fontWeight: '600', color: '#fff', fontVariant: ['tabular-nums'] },
});
